# frozen_string_literal: true

require "spec_helper"
require "json"

# Template signer roles: a template set up in the TurboDocx UI (signers + fields dragged onto the
# PDF) is sent by naming each recipient's role. Mirrors the js-sdk turbosign-template-roles tests.
# Bodies carry `recipients`/`fields` as JSON strings, so they are parsed before asserting.
RSpec.describe TurboDocxSdk::TurboSign do
  let(:template_id) { "84759112-d9d6-443a-bb78-87c427bd7948" }

  context "with a stubbed HttpClient" do
    let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }

    before do
      described_class.instance_variable_set(:@client, nil)
      allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
      allow(mock_client).to receive(:sender_config).and_return({
        "senderEmail" => "sender@company.com",
        "senderName" => "Sender"
      })
      described_class.configure(api_key: "k", org_id: "o", sender_email: "sender@company.com")
    end

    describe ".send_signature" do
      it "sends each recipient's role and an empty fields list when fields are omitted" do
        allow(mock_client).to receive(:post)
          .and_return({ "success" => true, "documentId" => "doc-1", "status" => "under_review" })

        result = described_class.send_signature(
          templateId: template_id,
          recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }]
        )

        expect(result["documentId"]).to eq("doc-1")
        expect(mock_client).to have_received(:post) do |path, body|
          expect(path).to eq("/turbosign/single/prepare-for-signing")
          expect(body["templateId"]).to eq(template_id)
          expect(JSON.parse(body["recipients"])).to eq(
            [{ "role" => "client", "name" => "Jane Doe", "email" => "jane@client.com" }]
          )
          expect(JSON.parse(body["fields"])).to eq([])
        end
      end

      it "still sends the fields a caller passes alongside roles" do
        allow(mock_client).to receive(:post).and_return({ "success" => true, "documentId" => "doc-1" })
        extra = { "type" => "signature", "recipientEmail" => "w@x.com", "page" => 1, "x" => 1, "y" => 1,
                  "width" => 100, "height" => 30 }

        described_class.send_signature(
          templateId: template_id,
          recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }],
          fields: [extra]
        )

        expect(mock_client).to have_received(:post) do |_path, body|
          expect(JSON.parse(body["fields"])).to eq([extra])
        end
      end
    end

    describe ".create_signature_review_link" do
      it "sends roles to prepare-for-review with an empty fields list when fields are omitted" do
        allow(mock_client).to receive(:post)
          .and_return({ "success" => true, "documentId" => "doc-2", "status" => "review_ready" })

        described_class.create_signature_review_link(
          templateId: template_id,
          recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }]
        )

        expect(mock_client).to have_received(:post) do |path, body|
          expect(path).to eq("/turbosign/single/prepare-for-review")
          expect(JSON.parse(body["recipients"])[0]["role"]).to eq("client")
          expect(JSON.parse(body["fields"])).to eq([])
        end
      end
    end

    describe ".create_embedded_signature" do
      it "passes each recipient's role through to the send" do
        send_body = nil
        allow(mock_client).to receive(:post) do |path, body|
          if path == "/turbosign/single/prepare-for-signing"
            send_body = body
            { "success" => true, "documentId" => "doc-3", "status" => "under_review",
              "recipients" => [{ "id" => "rec-1", "name" => "Jane Doe", "email" => "jane@client.com" }] }
          else
            { "results" => { "url" => "https://app/sign/doc-3?token=J", "expiresAt" => nil,
                             "recipientId" => "rec-1" } }
          end
        end

        result = described_class.create_embedded_signature(
          templateId: template_id,
          recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }]
        )

        expect(JSON.parse(send_body["recipients"])).to eq(
          [{ "name" => "Jane Doe", "email" => "jane@client.com", "signingOrder" => 1, "role" => "client" }]
        )
        expect(JSON.parse(send_body["fields"])).to eq([])
        expect(send_body["templateId"]).to eq(template_id)
        expect(result["recipients"][0]["embedUrl"]).to eq("https://app/sign/doc-3?token=J")
      end

      it "returns recipients in the template's signing order, not the order passed" do
        # The template's roles sign client first; the API returns its signers in that order
        signing_url_responses = [
          { "results" => { "url" => "https://app/sign?token=J", "expiresAt" => nil, "recipientId" => "rec-client" } },
          { "results" => { "url" => "https://app/sign?token=S", "expiresAt" => nil, "recipientId" => "rec-counter" } }
        ]
        allow(mock_client).to receive(:post) do |path, _body|
          if path == "/turbosign/single/prepare-for-signing"
            { "success" => true, "documentId" => "doc-4", "status" => "under_review",
              "recipients" => [
                { "id" => "rec-client", "name" => "Jane Doe", "email" => "jane@client.com" },
                { "id" => "rec-counter", "name" => "Sam Lee", "email" => "sam@acme.com" }
              ] }
          else
            signing_url_responses.shift
          end
        end

        result = described_class.create_embedded_signature(
          templateId: template_id,
          recipients: [
            { role: "countersigner", name: "Sam Lee", email: "sam@acme.com" },
            { role: "client", name: "Jane Doe", email: "jane@client.com" }
          ]
        )

        expect(result["recipients"].map { |r| r["email"] }).to eq(["jane@client.com", "sam@acme.com"])
        expect(result["recipients"].map { |r| r["embedUrl"] }).to eq(
          ["https://app/sign?token=J", "https://app/sign?token=S"]
        )
      end
    end

    describe ".get_template_signature_setup" do
      it "GETs the template's signer roles and returns the unwrapped hash" do
        summary = {
          "templateId" => template_id,
          "roles" => [
            { "key" => "client", "label" => "Client", "order" => 1, "hasSavedSigner" => false, "fieldCount" => 3 },
            { "key" => "countersigner", "label" => "Countersigner", "order" => 2, "hasSavedSigner" => true,
              "defaultName" => "Sam Lee", "defaultEmail" => "sam@acme.com", "fieldCount" => 2 }
          ]
        }
        allow(mock_client).to receive(:get).and_return(summary)

        result = described_class.get_template_signature_setup(template_id)

        expect(mock_client).to have_received(:get).with("/turbosign/templates/#{template_id}/signature-setup")
        expect(result).to eq(summary)
      end

      it "URL-encodes the template id" do
        allow(mock_client).to receive(:get).and_return({ "templateId" => "a/b", "roles" => [] })

        described_class.get_template_signature_setup("a/b")

        expect(mock_client).to have_received(:get).with("/turbosign/templates/a%2Fb/signature-setup")
      end
    end
  end

  context "with the real HttpClient" do
    before do
      described_class.instance_variable_set(:@client, nil)
      described_class.configure(api_key: "k", org_id: "o", sender_email: "sender@company.com",
                                base_url: "https://api.example.com")
    end

    def stub_http(response)
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

    it "unwraps the { data } envelope on the signature-setup GET" do
      response = Net::HTTPOK.new("1.1", "200", "OK")
      response["content-type"] = "application/json"
      body = { "data" => { "templateId" => template_id, "roles" => [] } }
      allow(response).to receive(:body).and_return(JSON.generate(body))
      captured = stub_http(response)

      result = described_class.get_template_signature_setup(template_id)

      expect(captured[:request]).to be_a(Net::HTTP::Get)
      expect(captured[:request].path).to eq("/turbosign/templates/#{template_id}/signature-setup")
      expect(result).to eq({ "templateId" => template_id, "roles" => [] })
    end

    it "surfaces the API's message and code when a role isn't on the template" do
      message = 'Unknown role "clinet". This template\'s roles are: client, countersigner'
      response = Net::HTTPBadRequest.new("1.1", "400", "Bad Request")
      allow(response).to receive(:body)
        .and_return(JSON.generate({ "message" => message, "type" => "UnknownSignerRole" }))
      stub_http(response)

      expect do
        described_class.send_signature(
          templateId: template_id,
          recipients: [{ role: "clinet", name: "Jane Doe", email: "jane@client.com" }]
        )
      end.to raise_error(TurboDocxSdk::ValidationError) { |e|
        expect(e.message).to eq(message)
        expect(e.code).to eq("UnknownSignerRole")
      }
    end
  end
end
