# frozen_string_literal: true

require "spec_helper"

# TurboQuote reminder + expiration schedule serialization specs.
#
# Mirrors the js-sdk, py-sdk and go-sdk turboquote-schedule suites case-for-case, per the
# cross-SDK test-parity rule.
#
# The quote send endpoints are JSON (unlike the multipart signature send), so the eight schedule
# fields ride FLAT at the top level of the request body -- NOT nested under a "schedule" key --
# and durations stay as plain { value:, unit: } OBJECTS, not JSON-encoded strings. Presence is
# null-checked, so a deliberate false / 0 survives while an unset field is omitted. Request-body
# keys are camelCase; the request hash is forwarded verbatim, so nothing is re-cased.
RSpec.describe TurboDocxSdk::TurboQuote do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }

  before do
    described_class.instance_variable_set(:@client, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
    described_class.configure(api_key: "test-key", org_id: "org-1")
  end

  schedule_keys = %w[
    remindersEnabled reminderDelay reminderInterval maxReminders
    expirationEnabled expireAfter expirationWarning expirationWarningInterval
  ]

  describe "send_quote schedule serialization" do
    it "sends every schedule field FLAT at the top level with object durations" do
      allow(mock_client).to receive(:post).and_return(
        { "result" => { "id" => "q-1", "status" => "sent" }, "message" => "Quote sent" }
      )

      described_class.send_quote("q-1",
        "ccEmails" => ["admin@example.com"],
        "remindersEnabled" => true,
        "reminderDelay" => { "value" => 3, "unit" => "days" },
        "reminderInterval" => { "value" => 12, "unit" => "hours" },
        "maxReminders" => 5,
        "expirationEnabled" => true,
        "expireAfter" => { "value" => 30, "unit" => "days" },
        "expirationWarning" => { "value" => 3, "unit" => "days" },
        "expirationWarningInterval" => { "value" => 1, "unit" => "days" }
      )

      expect(mock_client).to have_received(:post) do |path, body|
        expect(path).to eq("/v1/quotes/q-1/send")

        # Flat at the top level, never nested under "schedule".
        expect(body).not_to have_key("schedule")

        # Native boolean / integer -- not stringified.
        expect(body["remindersEnabled"]).to be(true)
        expect(body["expirationEnabled"]).to be(true)
        expect(body["maxReminders"]).to eq(5)

        # Durations are hash OBJECTS, not JSON strings (this is a JSON endpoint).
        expect(body["reminderDelay"]).to eq({ "value" => 3, "unit" => "days" })
        expect(body["reminderDelay"]).to be_a(Hash)
        expect(body["reminderInterval"]).to eq({ "value" => 12, "unit" => "hours" })
        expect(body["expireAfter"]).to eq({ "value" => 30, "unit" => "days" })
        expect(body["expirationWarning"]).to eq({ "value" => 3, "unit" => "days" })
        expect(body["expirationWarningInterval"]).to eq({ "value" => 1, "unit" => "days" })

        expect(body["ccEmails"]).to eq(["admin@example.com"])
      end
    end

    it "omits every schedule key when the caller sets none, so the org defaults apply" do
      allow(mock_client).to receive(:post).and_return(
        { "result" => { "id" => "q-1", "status" => "sent" }, "message" => "Quote sent" }
      )

      described_class.send_quote("q-1", "ccEmails" => ["admin@example.com"])

      expect(mock_client).to have_received(:post) do |_path, body|
        schedule_keys.each { |key| expect(body).not_to have_key(key) }
      end
    end

    # false and 0 are meaningful, not "unset" -- dropping them would silently fall back to the org
    # default, the opposite of what the caller asked for.
    it "preserves the meaningful zeros: maxReminders:0 and expirationEnabled:false" do
      allow(mock_client).to receive(:post).and_return(
        { "result" => { "id" => "q-1", "status" => "sent" }, "message" => "Quote sent" }
      )

      described_class.send_quote("q-1", "maxReminders" => 0, "expirationEnabled" => false)

      expect(mock_client).to have_received(:post) do |_path, body|
        expect(body["maxReminders"]).to eq(0)
        expect(body["expirationEnabled"]).to be(false)
      end
    end
  end

  describe "send_quote_with_deliverable schedule serialization" do
    it "carries the schedule FLAT alongside the deliverable fields" do
      allow(mock_client).to receive(:post).and_return(
        { "result" => { "id" => "q-1", "status" => "sent" }, "message" => "Sent", "documentId" => "doc-2" }
      )

      described_class.send_quote_with_deliverable("q-1",
        "deliverableId" => "del-1",
        "mergePosition" => "end",
        "remindersEnabled" => true,
        "reminderDelay" => { "value" => 2, "unit" => "days" },
        "expirationEnabled" => false
      )

      expect(mock_client).to have_received(:post) do |path, body|
        expect(path).to eq("/v1/quotes/q-1/send-with-deliverable")
        expect(body).not_to have_key("schedule")
        expect(body["deliverableId"]).to eq("del-1")
        expect(body["remindersEnabled"]).to be(true)
        expect(body["reminderDelay"]).to eq({ "value" => 2, "unit" => "days" })
        expect(body["expirationEnabled"]).to be(false)
      end
    end
  end

  describe "create_and_send schedule serialization" do
    it "emits the flat schedule on the /send request body" do
      bodies = []
      call_count = 0
      allow(mock_client).to receive(:post) do |path, body|
        bodies << [path, body]
        call_count += 1
        case call_count
        when 1 then { "result" => { "id" => "q-1", "status" => "draft" }, "message" => "Quote created successfully" }
        else { "result" => { "id" => "q-1", "status" => "sent" }, "message" => "Sent" }
        end
      end

      described_class.create_and_send(
        "name" => "Enterprise License",
        "companyId" => "c-1",
        "contactId" => "ct-1",
        "send" => {
          "remindersEnabled" => true,
          "maxReminders" => 0,
          "reminderDelay" => { "value" => 1, "unit" => "days" }
        }
      )

      expect(bodies[0][0]).to eq("/v1/quotes")
      expect(bodies[1][0]).to eq("/v1/quotes/q-1/send")

      send_body = bodies[1][1]
      expect(send_body).not_to have_key("schedule")
      expect(send_body["remindersEnabled"]).to be(true)
      expect(send_body["maxReminders"]).to eq(0)
      expect(send_body["reminderDelay"]).to eq({ "value" => 1, "unit" => "days" })
    end
  end
end
