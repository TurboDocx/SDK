# frozen_string_literal: true

require "spec_helper"

# With fitAnchoredTags absent, every request is exactly what it was before the option existed: the
# same path and body, key for key and in the same order, on both send paths (multipart and JSON) and
# on create_embedded_signature, whose fields shorthand keeps its default size. These expectations
# pass unchanged against the code from before the option was added.
RSpec.describe "TurboSign requests without fitAnchoredTags" do
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
  # Every other option, so the order of all the keys around the flag is pinned too.
  let(:options) do
    { documentName: "Contract", documentDescription: "Please sign", senderName: "Acme",
      ccEmails: ["cc@example.com"], sendEmail: false, remindersEnabled: true,
      reminderDelay: { value: 2, unit: "days" } }
  end
  let(:expected) do
    [
      ["recipients", JSON.generate(recipients)],
      ["fields", JSON.generate(fields)],
      ["documentName", "Contract"],
      ["documentDescription", "Please sign"],
      ["senderEmail", "sender@example.com"],
      ["senderName", "Acme"],
      ["ccEmails", '["cc@example.com"]'],
      ["sendEmail", false],
      ["remindersEnabled", true],
      ["reminderDelay", '{"value":2,"unit":"days"}']
    ]
  end
  let(:captured) { [] }

  before do
    sign.instance_variable_set(:@client, nil)
    sign.configure(api_key: "TDX-test", org_id: "org-1", sender_email: "sender@example.com")
    allow_any_instance_of(TurboDocxSdk::HttpClient).to receive(:post_form_data) do |_client, path, parts|
      captured << [path, parts]
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
      it "sends the same multipart form" do
        sign.public_send(method, { file: StringIO.new("%PDF-1.4 fake"), recipients: recipients, fields: fields }.merge(options))

        sent_path, parts = captured.first
        expect(sent_path).to eq(path)
        expect(parts.keys.first).to eq("file")
        expect(parts.except("file").to_a).to eq(expected.map { |key, value| [key, value.to_s] })
      end

      it "sends the same JSON body" do
        sign.public_send(method, { fileLink: "https://example.com/c.pdf", recipients: recipients, fields: fields }.merge(options))

        sent_path, body = captured.first
        expect(sent_path).to eq(path)
        expect(JSON.generate(body)).to eq(JSON.generate((expected + [["fileLink", "https://example.com/c.pdf"]]).to_h))
      end
    end
  end

  it ".create_embedded_signature sends the same body, with the shorthand's default size" do
    sign.create_embedded_signature(
      fileLink: "https://example.com/c.pdf",
      recipients: [{ name: "Jane Doe", email: "jane@example.com", fields: { signature: "{ClientSign}", date: "{Date}" } }]
    )

    sent_path, body = captured.first
    expect(sent_path).to eq("/turbosign/single/prepare-for-signing")
    expect(body.keys).to eq(%w[recipients fields senderEmail sendEmail fileLink])
    expect(body["fields"]).to eq(
      '[{"type":"signature","recipientEmail":"jane@example.com",' \
      '"template":{"anchor":"{ClientSign}","placement":"replace","size":{"width":100,"height":30}}},' \
      '{"type":"date","recipientEmail":"jane@example.com",' \
      '"template":{"anchor":"{Date}","placement":"replace","size":{"width":75,"height":30}}}]'
    )
    expect(body["sendEmail"]).to eq(false)
  end
end
