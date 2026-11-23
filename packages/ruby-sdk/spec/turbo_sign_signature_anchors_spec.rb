# frozen_string_literal: true

require "spec_helper"
require "json"

# Template signature setups with anchored fields: a field tied to a template tag (like
# "{ClientSign}") for one signer role. Mirrors the js-sdk turbosign-signature-anchors tests.
RSpec.describe TurboDocxSdk::TurboSign do
  let(:template_id) { "84759112-d9d6-443a-bb78-87c427bd7948" }
  let(:saved_setup) do
    {
      "roles" => [{ "roleId" => "r1", "label" => "Signer 1", "order" => 1 }],
      "fields" => [{ "roleId" => "r1", "type" => "signature", "anchor" => "{ClientSign}", "fieldId" => "f1" }],
      "savedOn" => "2026-11-06T00:00:00.000Z"
    }
  end
  let(:anchored_field) do
    { type: "signature", recipientEmail: "jane@client.com", template: { anchor: "{ClientSign}" } }
  end
  let(:recipients) { [{ name: "Jane Doe", email: "jane@client.com", signingOrder: 1 }] }

  context "with a stubbed HttpClient" do
    let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }
    let(:send_response) { { "success" => true, "documentId" => "doc-1", "status" => "under_review" } }

    before do
      described_class.instance_variable_set(:@client, nil)
      allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
      allow(mock_client).to receive(:sender_config).and_return({ "senderEmail" => "sender@company.com" })
      described_class.configure(api_key: "k", org_id: "o", sender_email: "sender@company.com")
    end

    describe "applySignatureSetup" do
      it "sends applySignatureSetup: true on send_signature and create_signature_review_link" do
        bodies = []
        allow(mock_client).to receive(:post) { |_path, body| bodies << body and send_response }

        described_class.send_signature(templateId: template_id, recipients: recipients,
                                       fields: [anchored_field], applySignatureSetup: true)
        described_class.create_signature_review_link(templateId: template_id, recipients: recipients,
                                                     fields: [anchored_field], applySignatureSetup: true)

        expect(bodies.map { |b| b["applySignatureSetup"] }).to eq([true, true])
      end

      it "forwards an explicit false and leaves the key out when omitted" do
        bodies = []
        allow(mock_client).to receive(:post) { |_path, body| bodies << body and send_response }

        described_class.send_signature(templateId: template_id, recipients: recipients,
                                       fields: [anchored_field], applySignatureSetup: false)
        described_class.send_signature(templateId: template_id, recipients: recipients, fields: [anchored_field])

        expect(bodies[0]["applySignatureSetup"]).to be(false)
        expect(bodies[1]).not_to have_key("applySignatureSetup")
      end

      it "sends it as a form field on a file upload" do
        allow(mock_client).to receive(:upload_file).and_return(send_response)

        described_class.send_signature(file: "%PDF-1.4", recipients: recipients,
                                       fields: [anchored_field], applySignatureSetup: true)

        expect(mock_client).to have_received(:upload_file) do |_path, _file, opts|
          expect(opts[:additional_data]["applySignatureSetup"]).to be(true)
        end
      end
    end

    describe ".get_template_signature_setup" do
      it "passes each role's anchoredFieldCount and the template's anchors through" do
        summary = {
          "templateId" => template_id,
          "roles" => [{ "key" => "signer_1", "label" => "Signer 1", "order" => 1, "hasSavedSigner" => false,
                        "fieldCount" => 1, "anchoredFieldCount" => 1 }],
          "anchors" => [{ "fieldId" => "f1", "roleKey" => "signer_1", "type" => "signature",
                          "anchor" => "{ClientSign}", "placement" => "replace", "notFound" => false }]
        }
        allow(mock_client).to receive(:get).and_return(summary)

        setup = described_class.get_template_signature_setup(template_id)

        expect(setup["roles"][0]["anchoredFieldCount"]).to eq(1)
        expect(setup["anchors"][0]).to eq(summary["anchors"][0])
      end
    end

    describe ".add_template_signature_anchor" do
      it "POSTs the anchored field (without templateId) and returns the unwrapped result" do
        allow(mock_client).to receive(:post).and_return(
          { "results" => { "fieldId" => "f1", "signatureSetup" => saved_setup, "tagBecameSignatureField" => true } }
        )
        request = {
          templateId: template_id,
          roleKey: "signer_1",
          type: "signature",
          anchor: "{ClientSign}",
          size: { width: 120, height: 30 },
          offset: { x: 0, y: 5 },
          placement: "replace"
        }
        original = Marshal.load(Marshal.dump(request))

        result = described_class.add_template_signature_anchor(request)

        expect(mock_client).to have_received(:post) do |path, body|
          expect(path).to eq("/turbosign/templates/#{template_id}/signature-setup/anchors")
          expect(body).to eq({
                               "roleKey" => "signer_1",
                               "type" => "signature",
                               "anchor" => "{ClientSign}",
                               "size" => { width: 120, height: 30 },
                               "offset" => { x: 0, y: 5 },
                               "placement" => "replace"
                             })
        end
        expect(result).to eq({ "fieldId" => "f1", "signatureSetup" => saved_setup, "tagBecameSignatureField" => true })
        expect(request).to eq(original)
      end

      it "forwards an explicit isReadonly false and URL-encodes the template id" do
        allow(mock_client).to receive(:post).and_return({ "results" => { "fieldId" => "f1" } })

        described_class.add_template_signature_anchor(
          "templateId" => "a/b", "roleKey" => "signer_1", "type" => "text", "anchor" => "{Name}",
          "defaultValue" => "Jane", "isReadonly" => false
        )

        expect(mock_client).to have_received(:post) do |path, body|
          expect(path).to eq("/turbosign/templates/a%2Fb/signature-setup/anchors")
          expect(body).to eq({ "roleKey" => "signer_1", "type" => "text", "anchor" => "{Name}",
                               "defaultValue" => "Jane", "isReadonly" => false })
        end
      end
    end

    describe ".remove_template_signature_anchor" do
      it "DELETEs the field by its encoded id and returns the remaining setup" do
        allow(mock_client).to receive(:delete)
          .and_return({ "results" => { "signatureSetup" => saved_setup.merge("fields" => []) } })

        result = described_class.remove_template_signature_anchor(template_id, "f/1")

        expect(mock_client).to have_received(:delete)
          .with("/turbosign/templates/#{template_id}/signature-setup/anchors/f%2F1")
        expect(result["signatureSetup"]["fields"]).to eq([])
      end
    end

    describe "the results envelope" do
      # Same as the JS, Python, Go and Java SDKs: the outer object is never read as the result
      it "add_template_signature_anchor reads only results" do
        allow(mock_client).to receive(:post)
          .and_return({ "fieldId" => "outer", "signatureSetup" => saved_setup, "tagBecameSignatureField" => true })

        result = described_class.add_template_signature_anchor(templateId: template_id, roleKey: "signer_1",
                                                               type: "signature", anchor: "{ClientSign}")

        expect(result).to be_nil
      end

      it "remove_template_signature_anchor reads only results" do
        allow(mock_client).to receive(:delete).and_return({ "signatureSetup" => saved_setup })

        expect(described_class.remove_template_signature_anchor(template_id, "f1")).to be_nil
      end
    end
  end

  context "with the real HttpClient" do
    before do
      described_class.instance_variable_set(:@client, nil)
      described_class.configure(api_key: "k", org_id: "o", sender_email: "sender@company.com",
                                base_url: "https://api.example.com")
    end

    def stub_http(response, body)
      allow(response).to receive(:body).and_return(JSON.generate(body))
      http = instance_double(Net::HTTP)
      allow(Net::HTTP).to receive(:new).and_return(http)
      allow(http).to receive(:use_ssl=)
      captured = {}
      allow(http).to receive(:request) do |req|
        captured[:request] = req
        response
      end
      captured
    end

    it "surfaces a tag owned by another role as ConflictError with its code" do
      stub_http(Net::HTTPConflict.new("1.1", "409", "Conflict"),
                { "message" => "The tag {ClientSign} already belongs to another signer.",
                  "type" => "AnchorOwnedByOtherRole", "error" => "x", "code" => "AnchorOwnedByOtherRole" })

      expect do
        described_class.add_template_signature_anchor(templateId: template_id, roleKey: "signer_2",
                                                      type: "signature", anchor: "{ClientSign}")
      end.to raise_error(TurboDocxSdk::ConflictError) { |e| expect(e.code).to eq("AnchorOwnedByOtherRole") }
    end

    # The anchor routes' 423 comes from the template lock middleware: no code or type
    let(:locked_body) do
      { "error" => "Resource is locked", "message" => "This template is currently being edited",
        "data" => { "locked" => true, "lockedBy" => "user-1", "lockedOn" => "2026-11-09T10:00:00.000Z" } }
    end

    it "surfaces a locked template as a 423 TurboDocxError" do
      stub_http(Net::HTTPLocked.new("1.1", "423", "Locked"), locked_body)

      expect do
        described_class.add_template_signature_anchor(templateId: template_id, roleKey: "signer_1",
                                                      type: "signature", anchor: "{ClientSign}")
      end.to raise_error(TurboDocxSdk::TurboDocxError) { |e|
        expect(e.status_code).to eq(423)
        expect(e.message).to eq("This template is currently being edited")
      }
    end

    it "surfaces a locked template on remove as a 423 TurboDocxError" do
      stub_http(Net::HTTPLocked.new("1.1", "423", "Locked"), locked_body)

      expect do
        described_class.remove_template_signature_anchor(template_id, "f1")
      end.to raise_error(TurboDocxSdk::TurboDocxError) { |e| expect(e.status_code).to eq(423) }
    end

    it "sends a DELETE and surfaces an unknown field id as NotFoundError" do
      captured = stub_http(Net::HTTPNotFound.new("1.1", "404", "Not Found"),
                           { "message" => "No anchored field with this id in the signature setup",
                             "code" => "SetupFieldNotFound" })

      expect do
        described_class.remove_template_signature_anchor(template_id, "nope")
      end.to raise_error(TurboDocxSdk::NotFoundError) { |e| expect(e.code).to eq("SetupFieldNotFound") }
      expect(captured[:request]).to be_a(Net::HTTP::Delete)
      expect(captured[:request].path).to eq("/turbosign/templates/#{template_id}/signature-setup/anchors/nope")
    end
  end
end
