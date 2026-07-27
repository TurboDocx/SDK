# frozen_string_literal: true

require "spec_helper"

RSpec.describe TurboDocxSdk::TurboSign do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }

  before do
    described_class.instance_variable_set(:@client, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
    allow(mock_client).to receive(:sender_config).and_return({
      "senderEmail" => "test@company.com",
      "senderName" => "Test Company"
    })
  end

  # ============================================
  # CONFIGURATION
  # ============================================

  describe ".configure" do
    it "configures the client with API key and sender email" do
      described_class.configure(
        api_key: "test-api-key",
        org_id: "test-org-id",
        sender_email: "test@company.com"
      )
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "test-api-key",
        access_token: nil,
        org_id: "test-org-id",
        sender_email: "test@company.com",
        sender_name: nil,
        base_url: nil,
        client_context: nil
      )
    end

    it "configures with custom base URL" do
      described_class.configure(
        api_key: "test-api-key",
        org_id: "test-org-id",
        sender_email: "test@company.com",
        base_url: "https://custom-api.example.com"
      )
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "test-api-key",
        access_token: nil,
        org_id: "test-org-id",
        sender_email: "test@company.com",
        sender_name: nil,
        base_url: "https://custom-api.example.com",
        client_context: nil
      )
    end

    it "configures with access token instead of API key" do
      described_class.configure(
        access_token: "oauth-token",
        org_id: "org-123",
        sender_email: "test@company.com"
      )
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: nil,
        access_token: "oauth-token",
        org_id: "org-123",
        sender_email: "test@company.com",
        sender_name: nil,
        base_url: nil,
        client_context: nil
      )
    end

    it "configures with sender name" do
      described_class.configure(
        api_key: "test-key",
        org_id: "org-1",
        sender_email: "sender@company.com",
        sender_name: "Sales Team"
      )
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "test-key",
        access_token: nil,
        org_id: "org-1",
        sender_email: "sender@company.com",
        sender_name: "Sales Team",
        base_url: nil,
        client_context: nil
      )
    end

    it "auto-initializes from env vars when not configured" do
      mock_response = { "status" => "under_review" }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.get_status("doc-123")
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(no_args)
    end
  end

  # ============================================
  # createSignatureReviewLink
  # ============================================

  describe ".create_signature_review_link" do
    before do
      described_class.configure(
        api_key: "test-key",
        org_id: "org-1",
        sender_email: "test@company.com"
      )
    end

    it "prepares document for review with file upload" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-123",
        "status" => "review_ready",
        "previewUrl" => "https://preview.example.com/doc-123",
        "message" => "Document prepared for review"
      }
      allow(mock_client).to receive(:upload_file).and_return(mock_response)

      fake_file = StringIO.new("fake-pdf-content")
      result = described_class.create_signature_review_link(
        "file" => fake_file,
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }]
      )

      expect(result["success"]).to eq(true)
      expect(result["documentId"]).to eq("doc-123")
      expect(result["status"]).to eq("review_ready")
      expect(result["previewUrl"]).to eq("https://preview.example.com/doc-123")
      expect(mock_client).to have_received(:upload_file).with(
        "/turbosign/single/prepare-for-review",
        fake_file,
        field_name: "file",
        additional_data: hash_including("recipients", "fields", "senderEmail")
      )
    end

    it "prepares document for review with file URL" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-456",
        "status" => "review_ready",
        "message" => "Document prepared for review"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.create_signature_review_link(
        "fileLink" => "https://storage.example.com/contract.pdf",
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }]
      )

      expect(result["documentId"]).to eq("doc-456")
      expect(mock_client).to have_received(:post).with(
        "/turbosign/single/prepare-for-review",
        hash_including(
          "fileLink" => "https://storage.example.com/contract.pdf",
          "recipients" => anything,
          "fields" => anything
        )
      )
    end

    it "prepares document for review with deliverable ID" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-789",
        "status" => "review_ready",
        "message" => "Document prepared for review"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.create_signature_review_link(
        "deliverableId" => "deliverable-abc",
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }]
      )

      expect(result["documentId"]).to eq("doc-789")
      expect(mock_client).to have_received(:post).with(
        "/turbosign/single/prepare-for-review",
        hash_including("deliverableId" => "deliverable-abc")
      )
    end

    it "prepares document for review with template ID" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-template",
        "status" => "review_ready",
        "message" => "Document prepared for review"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.create_signature_review_link(
        "templateId" => "template-xyz",
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }]
      )

      expect(result["documentId"]).to eq("doc-template")
    end

    it "includes optional fields in request" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-123",
        "status" => "review_ready",
        "message" => "Document prepared for review"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      described_class.create_signature_review_link(
        "fileLink" => "https://example.com/doc.pdf",
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }],
        "documentName" => "Test Contract",
        "documentDescription" => "A test contract",
        "senderName" => "Sales Team",
        "senderEmail" => "sales@company.com",
        "ccEmails" => ["admin@company.com", "legal@company.com"]
      )

      expect(mock_client).to have_received(:post).with(
        "/turbosign/single/prepare-for-review",
        hash_including(
          "documentName" => "Test Contract",
          "documentDescription" => "A test contract",
          "senderName" => "Sales Team",
          "senderEmail" => "sales@company.com",
          "ccEmails" => anything
        )
      )
    end

    it "supports anchor-based field positioning" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-anchor",
        "status" => "review_ready",
        "message" => "Document prepared for review"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      fields_with_anchor = [{
        "type" => "signature",
        "recipientEmail" => "john@example.com",
        "template" => {
          "anchor" => "{SignHere}",
          "placement" => "replace",
          "size" => { "width" => 200, "height" => 50 }
        }
      }]

      result = described_class.create_signature_review_link(
        "templateId" => "template-with-anchors",
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => fields_with_anchor
      )

      expect(result["documentId"]).to eq("doc-anchor")
    end
  end

  # ============================================
  # sendSignature
  # ============================================

  describe ".send_signature" do
    before do
      described_class.configure(
        api_key: "test-key",
        org_id: "org-1",
        sender_email: "test@company.com"
      )
    end

    it "prepares document for signing and sends emails" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-123",
        "message" => "Document sent for signing"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.send_signature(
        "fileLink" => "https://storage.example.com/contract.pdf",
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }]
      )

      expect(result["success"]).to eq(true)
      expect(result["documentId"]).to eq("doc-123")
      expect(result["message"]).to include("signing")
      expect(mock_client).to have_received(:post).with(
        "/turbosign/single/prepare-for-signing",
        anything
      )
    end

    it "handles file upload for signing" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-upload",
        "message" => "Document sent for signing"
      }
      allow(mock_client).to receive(:upload_file).and_return(mock_response)

      fake_file = StringIO.new("fake-pdf-content")
      result = described_class.send_signature(
        "file" => fake_file,
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }]
      )

      expect(result["documentId"]).to eq("doc-upload")
      expect(mock_client).to have_received(:upload_file).with(
        "/turbosign/single/prepare-for-signing",
        fake_file,
        field_name: "file",
        additional_data: hash_including("recipients", "fields", "senderEmail")
      )
    end

    it "supports checkbox fields with default values" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-checkbox",
        "message" => "Document sent for signing"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      fields_with_checkbox = [
        { "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" },
        { "type" => "checkbox", "page" => 1, "x" => 100, "y" => 600, "width" => 20, "height" => 20, "recipientEmail" => "john@example.com", "defaultValue" => "true" }
      ]

      result = described_class.send_signature(
        "fileLink" => "https://example.com/doc.pdf",
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => fields_with_checkbox
      )

      expect(result["documentId"]).to eq("doc-checkbox")
    end

    it "includes cc emails in the request" do
      mock_response = {
        "success" => true,
        "documentId" => "doc-cc",
        "message" => "Document sent for signing"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      described_class.send_signature(
        "fileLink" => "https://example.com/doc.pdf",
        "recipients" => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
        "fields" => [{ "type" => "signature", "page" => 1, "x" => 100, "y" => 500, "width" => 200, "height" => 50, "recipientEmail" => "john@example.com" }],
        "ccEmails" => ["admin@company.com"]
      )

      expect(mock_client).to have_received(:post).with(
        "/turbosign/single/prepare-for-signing",
        hash_including("ccEmails")
      )
    end
  end

  # ============================================
  # getStatus
  # ============================================

  describe ".get_status" do
    before do
      described_class.configure(
        api_key: "test-key",
        org_id: "org-1",
        sender_email: "test@company.com"
      )
    end

    it "gets document status" do
      mock_response = { "status" => "under_review" }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.get_status("doc-123")

      expect(result["status"]).to eq("under_review")
      expect(mock_client).to have_received(:get).with(
        "/turbosign/documents/doc-123/status"
      )
    end
  end

  # ============================================
  # download
  # ============================================

  describe ".download" do
    before do
      described_class.configure(
        api_key: "test-key",
        org_id: "org-1",
        sender_email: "test@company.com"
      )
    end

    it "downloads signed document via presigned URL" do
      mock_presigned_response = {
        "downloadUrl" => "https://s3.example.com/presigned-url",
        "fileName" => "signed-document.pdf"
      }
      allow(mock_client).to receive(:get).and_return(mock_presigned_response)

      # Mock Net::HTTP for the presigned URL download.
      # Use a real Net::HTTPSuccess so is_a? works naturally without stubbing.
      mock_http = instance_double(Net::HTTP)
      mock_response = Net::HTTPSuccess.new("1.1", "200", "OK")
      allow(mock_response).to receive(:body).and_return("fake-pdf-bytes")
      allow(Net::HTTP).to receive(:new).and_return(mock_http)
      allow(mock_http).to receive(:use_ssl=)
      allow(mock_http).to receive(:request).and_return(mock_response)

      result = described_class.download("doc-123")

      expect(result).to eq("fake-pdf-bytes")
      expect(mock_client).to have_received(:get).with(
        "/turbosign/documents/doc-123/download"
      )
    end

    it "raises error if S3 download fails" do
      mock_presigned_response = {
        "downloadUrl" => "https://s3.example.com/presigned-url",
        "fileName" => "signed-document.pdf"
      }
      allow(mock_client).to receive(:get).and_return(mock_presigned_response)

      # Use a real Net::HTTPForbidden so is_a?(Net::HTTPSuccess) returns false naturally.
      mock_http = instance_double(Net::HTTP)
      mock_response = Net::HTTPForbidden.new("1.1", "403", "Forbidden")
      allow(mock_response).to receive(:body).and_return("Forbidden")
      allow(Net::HTTP).to receive(:new).and_return(mock_http)
      allow(mock_http).to receive(:use_ssl=)
      allow(mock_http).to receive(:request).and_return(mock_response)

      expect {
        described_class.download("doc-123")
      }.to raise_error(TurboDocxSdk::TurboDocxError, /Failed to download file/)
    end
  end

  # ============================================
  # void
  # ============================================

  describe ".void_document" do
    before do
      described_class.configure(
        api_key: "test-key",
        org_id: "org-1",
        sender_email: "test@company.com"
      )
    end

    it "voids a document with reason" do
      mock_response = {
        "id" => "doc-123",
        "name" => "Test Document",
        "status" => "voided",
        "voidReason" => "Document needs revision",
        "voidedAt" => "2026-01-26T12:00:00.000Z"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.void_document("doc-123", "Document needs revision")

      expect(result["id"]).to eq("doc-123")
      expect(result["status"]).to eq("voided")
      expect(result["voidReason"]).to eq("Document needs revision")
      expect(result["voidedAt"]).to eq("2026-01-26T12:00:00.000Z")
      expect(mock_client).to have_received(:post).with(
        "/turbosign/documents/doc-123/void",
        { "reason" => "Document needs revision" }
      )
    end
  end

  # ============================================
  # resend
  # ============================================

  describe ".resend_email" do
    before do
      described_class.configure(
        api_key: "test-key",
        org_id: "org-1",
        sender_email: "test@company.com"
      )
    end

    it "resends email to specific recipients" do
      mock_response = { "success" => true, "recipientCount" => 2 }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.resend_email("doc-123", ["rec-1", "rec-2"])

      expect(result["success"]).to eq(true)
      expect(result["recipientCount"]).to eq(2)
      expect(mock_client).to have_received(:post).with(
        "/turbosign/documents/doc-123/resend-email",
        { "recipientIds" => ["rec-1", "rec-2"] }
      )
    end

    it "resends email to all recipients when empty array" do
      mock_response = { "success" => true, "recipientCount" => 3 }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.resend_email("doc-123", [])

      expect(result["success"]).to eq(true)
      expect(result["recipientCount"]).to eq(3)
      expect(mock_client).to have_received(:post).with(
        "/turbosign/documents/doc-123/resend-email",
        { "recipientIds" => [] }
      )
    end
  end

  # ============================================
  # getAuditTrail
  # ============================================

  describe ".get_audit_trail" do
    before do
      described_class.configure(
        api_key: "test-key",
        org_id: "org-1",
        sender_email: "test@company.com"
      )
    end

    it "gets audit trail for a document" do
      mock_response = {
        "document" => { "id" => "doc-123", "name" => "Test Document" },
        "auditTrail" => [
          { "id" => "audit-1", "documentId" => "doc-123", "actionType" => "document_created", "timestamp" => "2024-01-01T10:00:00Z" },
          { "id" => "audit-2", "documentId" => "doc-123", "actionType" => "email_sent", "timestamp" => "2024-01-01T10:01:00Z" },
          { "id" => "audit-3", "documentId" => "doc-123", "actionType" => "document_viewed", "timestamp" => "2024-01-01T11:00:00Z" },
          { "id" => "audit-4", "documentId" => "doc-123", "actionType" => "document_signed", "timestamp" => "2024-01-01T11:05:00Z" }
        ]
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.get_audit_trail("doc-123")

      expect(result["document"]["id"]).to eq("doc-123")
      expect(result["document"]["name"]).to eq("Test Document")
      expect(result["auditTrail"].length).to eq(4)
      expect(result["auditTrail"][0]["actionType"]).to eq("document_created")
      expect(result["auditTrail"][3]["actionType"]).to eq("document_signed")
      expect(mock_client).to have_received(:get).with(
        "/turbosign/documents/doc-123/audit-trail"
      )
    end

    it "returns empty entries for new document" do
      mock_response = {
        "document" => { "id" => "doc-new", "name" => "New Document" },
        "auditTrail" => []
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.get_audit_trail("doc-new")

      expect(result["document"]["id"]).to eq("doc-new")
      expect(result["auditTrail"].length).to eq(0)
    end
  end

  # ============================================
  # ERROR HANDLING
  # ============================================

  describe "Error Handling" do
    it "propagates not found errors" do
      allow(mock_client).to receive(:get).and_raise(TurboDocxSdk::NotFoundError, "Document not found")
      described_class.configure(api_key: "test-key", org_id: "org-1", sender_email: "test@company.com")

      expect {
        described_class.get_status("invalid-doc")
      }.to raise_error(TurboDocxSdk::NotFoundError, "Document not found")
    end

    it "propagates validation errors" do
      allow(mock_client).to receive(:post).and_raise(TurboDocxSdk::ValidationError, "Invalid email format")
      described_class.configure(api_key: "test-key", org_id: "org-1", sender_email: "test@company.com")

      expect {
        described_class.send_signature(
          "fileLink" => "https://example.com/doc.pdf",
          "recipients" => [{ "name" => "Test", "email" => "invalid-email", "signingOrder" => 1 }],
          "fields" => []
        )
      }.to raise_error(TurboDocxSdk::ValidationError, "Invalid email format")
    end

    it "propagates rate limit errors" do
      allow(mock_client).to receive(:post).and_raise(TurboDocxSdk::RateLimitError, "Rate limit exceeded")
      described_class.configure(api_key: "test-key", org_id: "org-1", sender_email: "test@company.com")

      expect {
        described_class.create_signature_review_link(
          "fileLink" => "https://example.com/doc.pdf",
          "recipients" => [{ "name" => "Test", "email" => "test@example.com", "signingOrder" => 1 }],
          "fields" => []
        )
      }.to raise_error(TurboDocxSdk::RateLimitError, "Rate limit exceeded")
    end

    it "propagates authentication errors" do
      allow(mock_client).to receive(:get).and_raise(TurboDocxSdk::AuthenticationError, "API key is required")
      described_class.configure(api_key: "test-key", org_id: "org-1", sender_email: "test@company.com")

      expect {
        described_class.get_status("doc-123")
      }.to raise_error(TurboDocxSdk::AuthenticationError, "API key is required")
    end
  end
end
