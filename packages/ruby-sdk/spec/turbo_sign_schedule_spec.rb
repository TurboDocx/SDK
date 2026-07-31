# frozen_string_literal: true

require "spec_helper"

# TurboSign reminder + expiration schedule specs.
#
# Mirrors the js-sdk and py-sdk suites case-for-case, per the cross-SDK test-parity rule.
#
# Durations are JSON-encoded on both send paths: multipart/form-data cannot carry a nested value,
# and the API decodes a JSON-string duration on either content type, so one code path serves both.
# Request-body keys stay camelCase — the API is not snake_case-aware.
RSpec.describe TurboDocxSdk::TurboSign do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }
  let(:recipients) { [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }] }
  let(:fields) do
    [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500,
       "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }]
  end

  before do
    described_class.instance_variable_set(:@client, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
    allow(mock_client).to receive(:sender_config).and_return({
      "senderEmail" => "test@company.com",
      "senderName" => "Test Company"
    })
    described_class.configure(
      api_key: "test-api-key",
      org_id: "test-org-id",
      sender_email: "test@company.com"
    )
  end

  describe "schedule overrides" do
    it "sends every schedule field the API accepts" do
      allow(mock_client).to receive(:post).and_return({})

      described_class.send_signature(
        deliverableId: "deliv-1",
        recipients: recipients,
        fields: fields,
        remindersEnabled: true,
        reminderDelay: { "value" => 3, "unit" => "days" },
        reminderInterval: { "value" => 12, "unit" => "hours" },
        maxReminders: 5,
        expirationEnabled: true,
        expireAfter: { "value" => 30, "unit" => "days" },
        expirationWarning: { "value" => 3, "unit" => "days" },
        expirationWarningInterval: { "value" => 1, "unit" => "days" }
      )

      expect(mock_client).to have_received(:post) do |_path, body|
        expect(body["remindersEnabled"]).to be(true)
        expect(body["maxReminders"]).to eq(5)
        expect(body["expirationEnabled"]).to be(true)
        expect(JSON.parse(body["reminderDelay"])).to eq({ "value" => 3, "unit" => "days" })
        expect(JSON.parse(body["reminderInterval"])).to eq({ "value" => 12, "unit" => "hours" })
        expect(JSON.parse(body["expireAfter"])).to eq({ "value" => 30, "unit" => "days" })
        expect(JSON.parse(body["expirationWarning"])).to eq({ "value" => 3, "unit" => "days" })
        expect(JSON.parse(body["expirationWarningInterval"])).to eq({ "value" => 1, "unit" => "days" })
      end
    end

    it "omits every schedule key when the caller sets none, so the org defaults apply" do
      allow(mock_client).to receive(:post).and_return({})

      described_class.send_signature(deliverableId: "deliv-1", recipients: recipients, fields: fields)

      expect(mock_client).to have_received(:post) do |_path, body|
        %w[remindersEnabled reminderDelay reminderInterval maxReminders expirationEnabled
           expireAfter expirationWarning expirationWarningInterval].each do |key|
          expect(body).not_to have_key(key)
        end
      end
    end

    # `false` is falsey in Ruby, so a truthiness check would drop an explicit "off" and silently
    # fall back to the org default — the opposite of what the caller asked for.
    it "sends remindersEnabled:false rather than dropping it" do
      allow(mock_client).to receive(:post).and_return({})

      described_class.send_signature(
        deliverableId: "d", recipients: recipients, fields: fields,
        remindersEnabled: false, expirationEnabled: false
      )

      expect(mock_client).to have_received(:post) do |_path, body|
        expect(body["remindersEnabled"]).to be(false)
        expect(body["expirationEnabled"]).to be(false)
      end
    end

    it "sends maxReminders:0 (no reminders) and -1 (unlimited) rather than dropping them" do
      # Capture on the stub itself — `have_received(...).twice { }` does not yield the args, so
      # the block never populates anything.
      bodies = []
      allow(mock_client).to receive(:post) do |_path, body|
        bodies << body
        {}
      end

      described_class.send_signature(
        deliverableId: "d", recipients: recipients, fields: fields, maxReminders: 0
      )
      described_class.send_signature(
        deliverableId: "d", recipients: recipients, fields: fields, maxReminders: -1
      )

      expect(bodies.length).to eq(2)
      expect(bodies[0]["maxReminders"]).to eq(0)
      expect(bodies[1]["maxReminders"]).to eq(-1)
    end

    # Zero is legal for the warning offset alone, and means "never warn".
    it "sends a zero expirationWarning, which means no warning emails" do
      allow(mock_client).to receive(:post).and_return({})

      described_class.send_signature(
        deliverableId: "d", recipients: recipients, fields: fields,
        expirationWarning: { "value" => 0, "unit" => "hours" }
      )

      expect(mock_client).to have_received(:post) do |_path, body|
        expect(JSON.parse(body["expirationWarning"])).to eq({ "value" => 0, "unit" => "hours" })
      end
    end

    it "carries the schedule through the multipart file-upload path" do
      allow(mock_client).to receive(:upload_file).and_return({})

      described_class.create_signature_review_link(
        file: "%PDF-1.4",
        recipients: recipients,
        fields: fields,
        remindersEnabled: true,
        reminderDelay: { "value" => 2, "unit" => "days" }
      )

      expect(mock_client).to have_received(:upload_file) do |_path, _file, opts|
        expect(opts[:additional_data]["remindersEnabled"]).to be(true)
        expect(JSON.parse(opts[:additional_data]["reminderDelay"])).to eq({ "value" => 2, "unit" => "days" })
      end
    end
  end

  describe ".send_reminder" do
    it "posts to the send-reminder endpoint for the given document" do
      allow(mock_client).to receive(:post).and_return({ "results" => [] })

      described_class.send_reminder("doc-123")

      expect(mock_client).to have_received(:post)
        .with("/turbosign/documents/doc-123/send-reminder", {})
    end

    it "passes named recipient ids through when supplied" do
      allow(mock_client).to receive(:post).and_return({ "results" => [] })

      described_class.send_reminder("doc-123", %w[r-1 r-2])

      expect(mock_client).to have_received(:post)
        .with("/turbosign/documents/doc-123/send-reminder", { "recipientIds" => %w[r-1 r-2] })
    end

    # An empty array is a caller mistake the API would 400 on (min 1 when the key is present).
    # Treat it as "no filter" rather than forwarding a request that cannot succeed.
    it "treats an empty recipient list as unfiltered" do
      allow(mock_client).to receive(:post).and_return({ "results" => [] })

      described_class.send_reminder("doc-123", [])

      expect(mock_client).to have_received(:post)
        .with("/turbosign/documents/doc-123/send-reminder", {})
    end

    it "returns the per-recipient results the API reports" do
      allow(mock_client).to receive(:post).and_return({
        "results" => [
          { "recipientId" => "r-1", "status" => "sent", "reminderCount" => 2, "phase" => "reminder" },
          { "recipientId" => "r-2", "status" => "skipped_wrong_order" }
        ]
      })

      result = described_class.send_reminder("doc-123")

      expect(result["results"].length).to eq(2)
      expect(result["results"][0]["status"]).to eq("sent")
      # A later-order signer is reported, not silently dropped.
      expect(result["results"][1]["status"]).to eq("skipped_wrong_order")
    end
  end
end
