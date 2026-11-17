# frozen_string_literal: true

require "spec_helper"

# fitAnchoredTags on the two send paths (and create_embedded_signature, which sends through
# send_signature). It is sent only when it is true or the string "true" in any case: the API treats
# false the same as a missing key, so every other value ("false", 1 and nil included) leaves it out
# and the request body stays exactly as it was. Only the
# network send is stubbed, so the multipart parts are the ones upload_file builds. Mirrors the js-sdk
# and py-sdk suites case for case.
RSpec.describe "TurboSign fitAnchoredTags" do
  let(:sign) { TurboDocxSdk::TurboSign }
  let(:sent) do
    {
      "success" => true, "documentId" => "doc-1", "status" => "under_review", "message" => "ok",
      "recipients" => [{ "id" => "rec-1", "name" => "Jane Doe", "email" => "jane@example.com" }]
    }
  end
  let(:signing_url) do
    { "url" => "https://app/sign/doc-1?token=T", "expiresAt" => nil, "recipientId" => "rec-1",
      "identityVerificationMode" => nil, "pendingChecks" => [] }
  end
  let(:recipients) { [{ name: "Jane Doe", email: "jane@example.com", signingOrder: 1 }] }
  let(:fields) { [{ type: "signature", recipientEmail: "jane@example.com", template: { anchor: "{ClientSign}" } }] }
  let(:captured) { [] }
  # Values that turn the flag on (sent as true) and values that leave it out.
  on_values = [true, "true", "TRUE", "True"]
  off_values = [false, "false", "FALSE", 1, 0, "1", "yes", "", nil]

  before do
    sign.instance_variable_set(:@client, nil)
    sign.configure(api_key: "TDX-test", org_id: "org-1", sender_email: "sender@example.com")
    allow_any_instance_of(TurboDocxSdk::HttpClient).to receive(:post_form_data) do |_client, path, parts|
      captured << [path, parts.reject { |key, _| key == "file" }]
      sent
    end
    allow_any_instance_of(TurboDocxSdk::HttpClient).to receive(:post) do |_client, path, body|
      captured << [path, body]
      path.end_with?("/signing-url") ? signing_url : sent
    end
  end

  after { sign.instance_variable_set(:@client, nil) }

  [
    [:send_signature, "/turbosign/single/prepare-for-signing"],
    [:create_signature_review_link, "/turbosign/single/prepare-for-review"]
  ].each do |method, path|
    describe ".#{method}" do
      {
        # upload_file sends each form value as a string, so true travels as "true"
        "a file upload (multipart)" => [-> { { file: StringIO.new("%PDF-1.4 fake pdf bytes") } }, "true"],
        "a file link (JSON)" => [-> { { fileLink: "https://example.com/contract.pdf" } }, true]
      }.each do |source_name, (source, sent_value)|
        context "with #{source_name}" do
          def body_for(method, source, extra)
            captured.clear
            sign.public_send(method, { recipients: recipients, fields: fields }.merge(source.call).merge(extra))
            captured.first
          end

          it "sends fitAnchoredTags when it is true" do
            sent_path, body = body_for(method, source, fitAnchoredTags: true)
            expect(sent_path).to eq(path)
            expect(body["fitAnchoredTags"]).to eq(sent_value)
          end

          it "leaves the key out when it is false or unset, and the body is otherwise unchanged" do
            _, unset = body_for(method, source, {})
            _, off = body_for(method, source, fitAnchoredTags: false)
            _, on = body_for(method, source, fitAnchoredTags: true)

            expect(unset).not_to have_key("fitAnchoredTags")
            expect(off).to eq(unset)
            expect(on.reject { |key, _| key == "fitAnchoredTags" }).to eq(unset)
          end

          on_values.each do |value|
            it "sends fitAnchoredTags for #{value.inspect}" do
              expect(body_for(method, source, fitAnchoredTags: value).last["fitAnchoredTags"]).to eq(sent_value)
            end
          end

          off_values.each do |value|
            it "leaves the key out for #{value.inspect}" do
              _, unset = body_for(method, source, {})
              expect(body_for(method, source, fitAnchoredTags: value).last).to eq(unset)
            end
          end
        end
      end
    end
  end

  describe ".create_embedded_signature" do
    def embedded_send_body(extra)
      captured.clear
      sign.create_embedded_signature(
        {
          fileLink: "https://example.com/contract.pdf",
          recipients: [{ name: "Jane Doe", email: "jane@example.com", fields: { signature: "{ClientSign}" } }]
        }.merge(extra)
      )
      expect(captured.first.first).to eq("/turbosign/single/prepare-for-signing")
      captured.first.last
    end

    it "passes fitAnchoredTags to the send when it is true" do
      expect(embedded_send_body(fitAnchoredTags: true)["fitAnchoredTags"]).to eq(true)
    end

    it "leaves the key out when it is false or unset" do
      unset = embedded_send_body({})
      off = embedded_send_body(fitAnchoredTags: false)

      expect(unset).not_to have_key("fitAnchoredTags")
      expect(off).to eq(unset)
    end

    on_values.each do |value|
      it "passes #{value.inspect} through as fitAnchoredTags true" do
        expect(embedded_send_body(fitAnchoredTags: value)["fitAnchoredTags"]).to eq(true)
      end

      it "leaves the default size off shorthand fields for #{value.inspect}, so they are fitted" do
        template = JSON.parse(embedded_send_body(fitAnchoredTags: value)["fields"]).first["template"]
        expect(template).to eq("anchor" => "{ClientSign}", "placement" => "replace")
      end
    end

    off_values.each do |value|
      it "leaves the key out for #{value.inspect}" do
        unset = embedded_send_body({})
        expect(embedded_send_body(fitAnchoredTags: value)).to eq(unset)
      end

      it "keeps the default size on shorthand fields for #{value.inspect}" do
        template = JSON.parse(embedded_send_body(fitAnchoredTags: value)["fields"]).first["template"]
        expect(template).to eq(
          "anchor" => "{ClientSign}", "placement" => "replace", "size" => { "width" => 100, "height" => 30 }
        )
      end
    end

    it "keeps a size the caller gave on top-level fields" do
      sized = [{ "type" => "signature", "recipientEmail" => "jane@example.com",
                 "template" => { "anchor" => "{ClientSign}", "size" => { "width" => 120, "height" => 40 } } }]
      body = embedded_send_body(fitAnchoredTags: true, fields: sized)
      expect(JSON.parse(body["fields"])).to eq(sized)
    end
  end
end
