# frozen_string_literal: true

require "spec_helper"
require "json"

# Unit tests for the embedded-signing surface of TurboSign:
#   - create_signing_url            (selector XOR, returnUrl guard, request passthrough, results unwrap)
#   - get_embedded_signing_settings (results unwrap)
#   - create_embedded_signature     (recipient/field mapping, signing-order output, turn-aware degrade)
#
# Mirrors the js-sdk tests (turbosign-identity*.test.ts, turbosign-embedded-signature-wire.test.ts).
# The HttpClient is a double, so smart_unwrap/normalization do NOT run here -- the doubles return the
# shape the real client would AFTER stripping the outer { data } (i.e. still carrying { "results" }).
RSpec.describe TurboDocxSdk::TurboSign do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }

  before do
    described_class.instance_variable_set(:@client, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
    allow(mock_client).to receive(:sender_config).and_return({
      "senderEmail" => "test@company.com",
      "senderName" => "Test Company"
    })
    described_class.configure(api_key: "test-key", org_id: "org-1", sender_email: "test@company.com")
  end

  # ============================================
  # create_signing_url
  # ============================================
  describe ".create_signing_url" do
    let(:ok_results) do
      {
        "url" => "https://app.turbodocx.com/e-signature/sign/doc-1?sut=tok",
        "expiresAt" => "2026-09-16T12:05:00Z",
        "recipientId" => "rec-1",
        "externalId" => "cust_1",
        "identityVerificationMode" => "external_idv",
        "pendingChecks" => []
      }
    end

    it "posts to the signing-url endpoint and unwraps the { results } envelope to the flat response" do
      # The real client already stripped the outer { data }; it yields { "results" => ... }.
      allow(mock_client).to receive(:post).and_return({ "results" => ok_results })

      result = described_class.create_signing_url("doc-1", external_id: "cust_1")

      # Flat response, never the { "results" => ... } wrapper.
      expect(result).to eq(ok_results)
      expect(result["results"]).to be_nil
      expect(result["identityVerificationMode"]).to eq("external_idv")
      expect(mock_client).to have_received(:post).with(
        "/turbosign/documents/doc-1/signing-url",
        { "externalId" => "cust_1" }
      )
    end

    it "passes an identity assertion through for external_idv" do
      allow(mock_client).to receive(:post).and_return({ "results" => ok_results })
      identity_assertion = {
        "provider" => "CAPA",
        "verificationId" => "capa_1",
        "verifiedAt" => "2026-09-16T11:59:00Z",
        "subjectEmail" => "jane@acme.com"
      }

      described_class.create_signing_url("doc-1", recipient_id: "rec-1", identity_assertion: identity_assertion)

      expect(mock_client).to have_received(:post).with(
        "/turbosign/documents/doc-1/signing-url",
        { "recipientId" => "rec-1", "identityAssertion" => identity_assertion }
      )
    end

    it "includes an https returnUrl in the request body" do
      allow(mock_client).to receive(:post).and_return({ "results" => ok_results })

      described_class.create_signing_url("doc-1", recipient_id: "rec-1", return_url: "https://app.test/done")

      expect(mock_client).to have_received(:post).with(
        "/turbosign/documents/doc-1/signing-url",
        { "recipientId" => "rec-1", "returnUrl" => "https://app.test/done" }
      )
    end

    it "rejects zero selectors before any HTTP call" do
      allow(mock_client).to receive(:post)

      expect { described_class.create_signing_url("doc-1") }.to raise_error(TurboDocxSdk::ValidationError)
      expect(mock_client).not_to have_received(:post)
    end

    it "rejects both selectors with code RecipientSelectorInvalid" do
      allow(mock_client).to receive(:post)

      expect do
        described_class.create_signing_url("doc-1", recipient_id: "rec-1", external_id: "cust_1")
      end.to raise_error(an_instance_of(TurboDocxSdk::ValidationError).and(having_attributes(code: "RecipientSelectorInvalid")))
      expect(mock_client).not_to have_received(:post)
    end

    it "treats an empty-string selector as absent (empty recipient_id fails the XOR)" do
      allow(mock_client).to receive(:post)

      expect do
        described_class.create_signing_url("doc-1", recipient_id: "")
      end.to raise_error(an_instance_of(TurboDocxSdk::ValidationError).and(having_attributes(code: "RecipientSelectorInvalid")))
      expect(mock_client).not_to have_received(:post)
    end

    it "rejects a non-https returnUrl with code InvalidReturnUrl" do
      allow(mock_client).to receive(:post)

      expect do
        described_class.create_signing_url("doc-1", recipient_id: "rec-1", return_url: "http://app.test")
      end.to raise_error(an_instance_of(TurboDocxSdk::ValidationError).and(having_attributes(code: "InvalidReturnUrl")))
      expect(mock_client).not_to have_received(:post)
    end
  end

  # ============================================
  # get_embedded_signing_settings
  # ============================================
  describe ".get_embedded_signing_settings" do
    it "GETs the settings endpoint and unwraps the results envelope" do
      settings = {
        "enabled" => true,
        "allowExternalIdv" => true,
        "allowIdentityOverride" => false,
        "defaultChannel" => "email",
        "allowedFrameAncestors" => ["https://app.example.com"]
      }
      allow(mock_client).to receive(:get).and_return({ "results" => settings })

      result = described_class.get_embedded_signing_settings

      expect(result).to eq(settings)
      expect(result["results"]).to be_nil
      expect(mock_client).to have_received(:get).with("/turbosign/embedded-signing-settings")
    end
  end

  # ============================================
  # create_embedded_signature
  # ============================================
  describe ".create_embedded_signature" do
    # Route both POST paths through one stub, discriminating by path. `send_response` is the flat
    # sendSignature shape; `signing_url_for` builds the signing-url { results } envelope per recipient.
    def stub_posts(send_response:, signing_url_for:)
      captured = { send_body: nil, signing_bodies: [] }
      allow(mock_client).to receive(:post) do |path, body|
        if path == "/turbosign/single/prepare-for-signing"
          captured[:send_body] = body
          send_response
        elsif path.end_with?("/signing-url")
          captured[:signing_bodies] << body
          signing_url_for.call(body)
        else
          raise "unexpected POST to #{path}"
        end
      end
      captured
    end

    def send_response(document_id, recipients)
      { "success" => true, "documentId" => document_id, "status" => "under_review", "recipients" => recipients }
    end

    def signing_results(recipient_id, url, mode)
      { "results" => { "url" => url, "expiresAt" => nil, "recipientId" => recipient_id,
                       "identityVerificationMode" => mode, "pendingChecks" => mode == "otp" ? ["email_otp"] : [] } }
    end

    it "calls send once then signing-url per recipient, returning results IN SIGNING ORDER" do
      captured = stub_posts(
        send_response: send_response("doc-1", [
          { "id" => "rec-1", "name" => "Alice", "email" => "alice@example.com" },
          { "id" => "rec-2", "name" => "Bob", "email" => "bob@example.com" }
        ]),
        signing_url_for: lambda do |body|
          if body["recipientId"] == "rec-2"
            signing_results("rec-2", "https://app/sign/doc-1?token=BOB", "otp")
          else
            signing_results("rec-1", "https://app/sign/doc-1?token=ALICE", "otp")
          end
        end
      )

      # Deliberately out of array order: Alice (index 0) signs 2nd, Bob (index 1) signs 1st.
      result = described_class.create_embedded_signature(
        templateId: "tmpl-1",
        documentName: "Contract",
        recipients: [
          { name: "Alice", email: "alice@example.com", signingOrder: 2, auth: { emailOtp: true } },
          { name: "Bob", email: "bob@example.com", signingOrder: 1, auth: { emailOtp: true } }
        ]
      )

      expect(result["documentId"]).to eq("doc-1")
      expect(result["recipients"].map { |r| r["name"] }).to eq(%w[Bob Alice])
      expect(result["recipients"][0]["recipientId"]).to eq("rec-2")
      expect(result["recipients"][0]["embedUrl"]).to eq("https://app/sign/doc-1?token=BOB")
      expect(result["recipients"][0]["identityVerificationMode"]).to eq("otp")
      expect(result["recipients"][0]["status"]).to eq("ready")
      expect(result["recipients"][1]["name"]).to eq("Alice")
      expect(result["recipients"][1]["embedUrl"]).to eq("https://app/sign/doc-1?token=ALICE")
      # The signing-url calls selected each recipient by the id send returned, in signing order.
      expect(captured[:signing_bodies].map { |b| b["recipientId"] }).to eq(%w[rec-2 rec-1])
    end

    it "maps auth.emailOtp to identityVerification { mode:otp, channel:email }, defaults order, suppresses email" do
      captured = stub_posts(
        send_response: send_response("doc-2", [{ "id" => "rec-1", "name" => "Alice", "email" => "alice@example.com" }]),
        signing_url_for: ->(_body) { signing_results("rec-1", "https://app/sign/doc-2?token=A", "otp") }
      )

      described_class.create_embedded_signature(
        templateId: "tmpl-1",
        recipients: [{ name: "Alice", email: "alice@example.com", auth: { emailOtp: true } }]
      )

      recipients = JSON.parse(captured[:send_body]["recipients"])
      expect(recipients[0]["identityVerification"]).to eq({ "mode" => "otp", "channel" => "email" })
      expect(recipients[0]["signingOrder"]).to eq(1)
      # Embedded flow suppresses recipient emails by default (false must survive the nil? guard).
      expect(captured[:send_body]["sendEmail"]).to eq(false)
    end

    it "maps auth.sms to identityVerification { mode:otp, channel:sms } and sets the recipient phone" do
      captured = stub_posts(
        send_response: send_response("doc-3", [{ "id" => "rec-1", "name" => "Alice", "email" => "alice@example.com" }]),
        signing_url_for: ->(_body) { signing_results("rec-1", "https://app/sign/doc-3?token=A", "otp") }
      )

      described_class.create_embedded_signature(
        templateId: "tmpl-1",
        recipients: [{ name: "Alice", email: "alice@example.com", auth: { sms: { phoneNumber: "+13055551234" } } }]
      )

      recipients = JSON.parse(captured[:send_body]["recipients"])
      expect(recipients[0]["identityVerification"]).to eq({ "mode" => "otp", "channel" => "sms" })
      expect(recipients[0]["phone"]).to eq("+13055551234")
    end

    it "expands the fields shorthand into field objects with placement:replace and default sizes" do
      captured = stub_posts(
        send_response: send_response("doc-4", [{ "id" => "rec-1", "name" => "Alice", "email" => "alice@example.com" }]),
        signing_url_for: ->(_body) { signing_results("rec-1", "https://app/sign/doc-4?token=A", nil) }
      )

      described_class.create_embedded_signature(
        templateId: "tmpl-1",
        recipients: [{
          name: "Alice", email: "alice@example.com",
          fields: { signature: "{signature1}", date: "{date1}", initials: "{initials1}", fullName: "{fullName1}" }
        }]
      )

      fields = JSON.parse(captured[:send_body]["fields"])
      expect(fields.length).to eq(4)

      signature = fields.find { |f| f["type"] == "signature" }
      expect(signature).to eq({
        "type" => "signature",
        "recipientEmail" => "alice@example.com",
        "template" => { "anchor" => "{signature1}", "placement" => "replace", "size" => { "width" => 100, "height" => 30 } }
      })
      expect(fields.find { |f| f["type"] == "date" }["template"]["size"]).to eq({ "width" => 75, "height" => 30 })
      # The `initials` shorthand emits the 'initial' field type.
      initial = fields.find { |f| f["type"] == "initial" }
      expect(initial["template"]).to eq({ "anchor" => "{initials1}", "placement" => "replace", "size" => { "width" => 50, "height" => 30 } })
      expect(fields.find { |f| f["type"] == "full_name" }["template"]["size"]).to eq({ "width" => 150, "height" => 30 })
    end

    it "prefers a top-level fields override over the per-recipient shorthand" do
      captured = stub_posts(
        send_response: send_response("doc-4b", [{ "id" => "rec-1", "name" => "Alice", "email" => "alice@example.com" }]),
        signing_url_for: ->(_body) { signing_results("rec-1", "https://app/sign/doc-4b?token=A", nil) }
      )
      override = [{ "type" => "signature", "recipientEmail" => "alice@example.com", "page" => 1, "x" => 10, "y" => 20 }]

      described_class.create_embedded_signature(
        templateId: "tmpl-1",
        fields: override,
        recipients: [{ name: "Alice", email: "alice@example.com", fields: { signature: "{sig}" } }]
      )

      expect(JSON.parse(captured[:send_body]["fields"])).to eq(override)
    end

    it "returns both recipients ready and in order for a 2-recipient request" do
      stub_posts(
        send_response: send_response("doc-5", [
          { "id" => "rec-1", "name" => "First", "email" => "first@example.com" },
          { "id" => "rec-2", "name" => "Second", "email" => "second@example.com" }
        ]),
        signing_url_for: lambda do |body|
          body["recipientId"] == "rec-1" ? signing_results("rec-1", "url-1", nil) : signing_results("rec-2", "url-2", nil)
        end
      )

      result = described_class.create_embedded_signature(
        templateId: "tmpl-1",
        recipients: [
          { name: "First", email: "first@example.com" },
          { name: "Second", email: "second@example.com" }
        ]
      )

      expect(result["recipients"].map { |r| r["email"] }).to eq(%w[first@example.com second@example.com])
      expect(result["recipients"].map { |r| r["embedUrl"] }).to eq(%w[url-1 url-2])
      expect(result["recipients"].map { |r| r["status"] }).to eq(%w[ready ready])
    end

    it "returns pending (nil URL, mode preserved) for a recipient the backend says is not in turn" do
      stub_posts(
        send_response: send_response("doc-6", [
          { "id" => "rec-1", "name" => "First", "email" => "first@example.com" },
          { "id" => "rec-2", "name" => "Second", "email" => "second@example.com" }
        ]),
        signing_url_for: lambda do |body|
          if body["recipientId"] == "rec-1"
            signing_results("rec-1", "https://app/sign/doc-6?token=FIRST", "otp")
          else
            raise TurboDocxSdk::ValidationError.new("It is not this recipient's turn to sign yet.", code: "RecipientNotInTurn")
          end
        end
      )

      result = described_class.create_embedded_signature(
        templateId: "tmpl-1",
        recipients: [
          { name: "First", email: "first@example.com", signingOrder: 1, auth: { emailOtp: true } },
          { name: "Second", email: "second@example.com", signingOrder: 2, auth: { emailOtp: true } }
        ]
      )

      expect(result["recipients"].length).to eq(2)
      expect(result["recipients"][0]["status"]).to eq("ready")
      expect(result["recipients"][0]["embedUrl"]).to eq("https://app/sign/doc-6?token=FIRST")

      pending_recipient = result["recipients"][1]
      expect(pending_recipient["name"]).to eq("Second")
      expect(pending_recipient["status"]).to eq("pending")
      expect(pending_recipient["embedUrl"]).to be_nil
      expect(pending_recipient["recipientId"]).to eq("rec-2")
      # The mode is re-derived locally from `auth` on the degraded path (server response is absent).
      expect(pending_recipient["identityVerificationMode"]).to eq("otp")
    end

    it "treats NotSignersTurn the same as RecipientNotInTurn (pending)" do
      stub_posts(
        send_response: send_response("doc-6b", [{ "id" => "rec-1", "name" => "Only", "email" => "only@example.com" }]),
        signing_url_for: lambda do |_body|
          raise TurboDocxSdk::ConflictError.new("not your turn", code: "NotSignersTurn")
        end
      )

      result = described_class.create_embedded_signature(
        templateId: "tmpl-1",
        recipients: [{ name: "Only", email: "only@example.com" }]
      )

      expect(result["recipients"][0]["status"]).to eq("pending")
      expect(result["recipients"][0]["embedUrl"]).to be_nil
    end

    it "returns completed (nil URL) for a recipient the backend says already signed" do
      stub_posts(
        send_response: send_response("doc-7", [{ "id" => "rec-1", "name" => "Done", "email" => "done@example.com" }]),
        signing_url_for: lambda do |_body|
          raise TurboDocxSdk::ConflictError.new("This recipient has already signed.", code: "RecipientAlreadySigned")
        end
      )

      result = described_class.create_embedded_signature(
        templateId: "tmpl-1",
        recipients: [{ name: "Done", email: "done@example.com" }]
      )

      expect(result["recipients"][0]["status"]).to eq("completed")
      expect(result["recipients"][0]["embedUrl"]).to be_nil
    end

    it "rethrows a genuine (non-turn) error instead of masking it as pending" do
      stub_posts(
        send_response: send_response("doc-8", [{ "id" => "rec-1", "name" => "X", "email" => "x@example.com" }]),
        signing_url_for: lambda do |_body|
          raise TurboDocxSdk::TurboDocxError.new("boom", status_code: 500, code: "InternalError")
        end
      )

      expect do
        described_class.create_embedded_signature(
          templateId: "tmpl-1",
          recipients: [{ name: "X", email: "x@example.com" }]
        )
      end.to raise_error(an_instance_of(TurboDocxSdk::TurboDocxError).and(having_attributes(code: "InternalError")))
    end

    it "raises EmbeddedRecipientNotReturned when send returns no recipient matching an email" do
      stub_posts(
        send_response: send_response("doc-9", [{ "id" => "rec-1", "name" => "Known", "email" => "known@example.com" }]),
        signing_url_for: ->(_body) { signing_results("rec-1", "url", nil) }
      )

      expect do
        described_class.create_embedded_signature(
          templateId: "tmpl-1",
          recipients: [{ name: "Ghost", email: "ghost@example.com" }]
        )
      end.to raise_error(an_instance_of(TurboDocxSdk::ValidationError).and(having_attributes(code: "EmbeddedRecipientNotReturned")))
    end

    it "accepts a fully string-keyed request (recipient, auth, and fields shorthand)" do
      captured = stub_posts(
        send_response: send_response("doc-str", [{ "id" => "rec-1", "name" => "Alice", "email" => "alice@example.com" }]),
        signing_url_for: ->(_body) { signing_results("rec-1", "https://app/sign/doc-str?token=A", "otp") }
      )

      # Every input hash uses string keys -- the SDK accepts both key styles throughout.
      result = described_class.create_embedded_signature(
        "templateId" => "tmpl-1",
        "recipients" => [{
          "name" => "Alice",
          "email" => "alice@example.com",
          "auth" => { "sms" => { "phoneNumber" => "+13055551234" } },
          "fields" => { "signature" => "{sig}" }
        }]
      )

      recipients = JSON.parse(captured[:send_body]["recipients"])
      expect(recipients[0]["identityVerification"]).to eq({ "mode" => "otp", "channel" => "sms" })
      expect(recipients[0]["phone"]).to eq("+13055551234")

      fields = JSON.parse(captured[:send_body]["fields"])
      expect(fields).to eq([{
        "type" => "signature",
        "recipientEmail" => "alice@example.com",
        "template" => { "anchor" => "{sig}", "placement" => "replace", "size" => { "width" => 100, "height" => 30 } }
      }])

      expect(result["recipients"][0]["status"]).to eq("ready")
    end

    it "forwards the email-suppression flag through the multipart file-upload path" do
      allow(mock_client).to receive(:upload_file).and_return(
        send_response("doc-file", [{ "id" => "rec-1", "name" => "A", "email" => "a@example.com" }])
      )
      allow(mock_client).to receive(:post).and_return(signing_results("rec-1", "url", nil))

      described_class.create_embedded_signature(
        file: StringIO.new("%PDF-1.4 fake"),
        recipients: [{ name: "A", email: "a@example.com" }]
      )

      # The file path routes through upload_file with the form fields as additional_data; the
      # suppression flag reaches it as boolean false (upload_file stringifies it into the multipart
      # body downstream, exactly as remindersEnabled already travels).
      expect(mock_client).to have_received(:upload_file).with(
        "/turbosign/single/prepare-for-signing",
        instance_of(StringIO),
        field_name: "file",
        additional_data: hash_including("sendEmail" => false)
      )
    end

    it "forwards an explicit sendEmail: true rather than the embedded default of false" do
      captured = stub_posts(
        send_response: send_response("doc-10", [{ "id" => "rec-1", "name" => "A", "email" => "a@example.com" }]),
        signing_url_for: ->(_body) { signing_results("rec-1", "url", nil) }
      )

      described_class.create_embedded_signature(
        templateId: "tmpl-1",
        sendEmail: true,
        recipients: [{ name: "A", email: "a@example.com" }]
      )

      expect(captured[:send_body]["sendEmail"]).to eq(true)
    end
  end
end
