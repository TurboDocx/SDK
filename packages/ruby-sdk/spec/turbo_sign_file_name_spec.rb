# frozen_string_literal: true

require "spec_helper"

# fileName on a file upload must reach the API as the multipart file part's filename (the API
# stores it as the document's file name). Real HttpClient; only the network send is stubbed.
RSpec.describe "TurboSign file uploads forward fileName" do
  let(:sign) { TurboDocxSdk::TurboSign }
  let(:response) { { "success" => true, "documentId" => "doc-1", "status" => "under_review", "recipients" => [], "message" => "ok" } }
  let(:captured_parts) { [] }
  let(:pdf) { StringIO.new("%PDF-1.4 fake pdf bytes") }

  before do
    sign.instance_variable_set(:@client, nil)
    sign.configure(api_key: "TDX-test", org_id: "org-1", sender_email: "sender@example.com")
    allow_any_instance_of(TurboDocxSdk::HttpClient).to receive(:post_form_data) do |_client, _path, parts|
      captured_parts << parts
      response
    end
  end

  after { sign.instance_variable_set(:@client, nil) }

  it "send_signature names the uploaded part with fileName, not as a form field" do
    sign.send_signature(recipients: [], fields: [], file: pdf, fileName: "Lease-Agreement-2026.pdf")

    parts = captured_parts.first
    expect(parts["file"][:filename]).to eq("Lease-Agreement-2026.pdf")
    expect(parts).not_to have_key("fileName")
  end

  it "send_signature falls back to document.<ext> without fileName" do
    sign.send_signature(recipients: [], fields: [], file: pdf)

    expect(captured_parts.first["file"][:filename]).to eq("document.pdf")
  end

  it "create_signature_review_link names the uploaded part with fileName" do
    sign.create_signature_review_link(recipients: [], fields: [], file: pdf, fileName: "Review-Copy.pdf")

    expect(captured_parts.first["file"][:filename]).to eq("Review-Copy.pdf")
  end

  it "accepts a string-keyed fileName" do
    sign.send_signature("recipients" => [], "fields" => [], "file" => pdf, "fileName" => "String-Keyed.pdf")

    expect(captured_parts.first["file"][:filename]).to eq("String-Keyed.pdf")
  end

  it "create_embedded_signature forwards fileName to the upload" do
    allow_any_instance_of(TurboDocxSdk::HttpClient).to receive(:post).and_return(
      "results" => { "url" => "https://app.example.com/e", "expiresAt" => nil, "recipientId" => "rec-1",
                     "identityVerificationMode" => nil, "pendingChecks" => [] }
    )
    response["recipients"] = [{ "id" => "rec-1", "name" => "Jane Doe", "email" => "jane@example.com" }]

    sign.create_embedded_signature(
      file: pdf,
      fileName: "Embedded-Contract.pdf",
      recipients: [{ name: "Jane Doe", email: "jane@example.com", fields: { signature: "{signature1}" } }]
    )

    expect(captured_parts.first["file"][:filename]).to eq("Embedded-Contract.pdf")
  end
end
