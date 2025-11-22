# frozen_string_literal: true

require "spec_helper"
require "json"

# TurboSign Module Tests
#
# Tests for 100% parity with n8n-nodes-turbodocx operations:
# - prepare_for_review
# - prepare_for_signing_single
# - get_status
# - download
# - void_document
# - resend_email

RSpec.describe TurboDocx::TurboSign do
  let(:api_key) { "test-api-key" }
  let(:base_url) { "https://api.turbodocx.com" }
  let(:client) { TurboDocx::Client.new(api_key: api_key, base_url: base_url) }

  let(:mock_recipients) do
    [{ name: "John Doe", email: "john@example.com", order: 1 }]
  end

  let(:mock_fields) do
    [{ type: "signature", page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }]
  end

  # ============================================
  # Configure Tests (2)
  # ============================================

  describe "configuration" do
    it "should configure the client with API key" do
      test_client = TurboDocx::Client.new(api_key: "test-api-key")
      expect(test_client).not_to be_nil
      expect(test_client.turbo_sign).not_to be_nil
    end

    it "should configure with custom base URL" do
      test_client = TurboDocx::Client.new(
        api_key: "test-api-key",
        base_url: "https://custom-api.example.com"
      )
      expect(test_client).not_to be_nil
    end
  end

  # ============================================
  # PrepareForReview Tests (5)
  # ============================================

  describe "#prepare_for_review" do
    it "should prepare document for review with file upload" do
      stub_request(:post, "#{base_url}/turbosign/single/prepare-for-review")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: {
              documentId: "doc-123",
              status: "review_ready",
              previewUrl: "https://preview.example.com/doc-123"
            }
          }.to_json
        )

      result = client.turbo_sign.prepare_for_review(
        file: "%PDF-mock-content",
        file_name: "contract.pdf",
        recipients: mock_recipients,
        fields: mock_fields
      )

      expect(result[:documentId]).to eq("doc-123")
      expect(result[:status]).to eq("review_ready")
      expect(result[:previewUrl]).not_to be_nil
    end

    it "should prepare document for review with file URL" do
      stub_request(:post, "#{base_url}/turbosign/single/prepare-for-review")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: {
              documentId: "doc-456",
              status: "review_ready",
              previewUrl: "https://preview.example.com/doc-456"
            }
          }.to_json
        )

      result = client.turbo_sign.prepare_for_review(
        file_link: "https://storage.example.com/contract.pdf",
        recipients: mock_recipients,
        fields: mock_fields
      )

      expect(result[:documentId]).to eq("doc-456")
    end

    it "should prepare document for review with deliverable ID" do
      stub_request(:post, "#{base_url}/turbosign/single/prepare-for-review")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: { documentId: "doc-789", status: "review_ready" }
          }.to_json
        )

      result = client.turbo_sign.prepare_for_review(
        deliverable_id: "deliverable-abc",
        recipients: mock_recipients,
        fields: mock_fields
      )

      expect(result[:documentId]).to eq("doc-789")
    end

    it "should prepare document for review with template ID" do
      stub_request(:post, "#{base_url}/turbosign/single/prepare-for-review")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: { documentId: "doc-template", status: "review_ready" }
          }.to_json
        )

      result = client.turbo_sign.prepare_for_review(
        template_id: "template-xyz",
        recipients: mock_recipients,
        fields: mock_fields
      )

      expect(result[:documentId]).to eq("doc-template")
    end

    it "should include optional fields in request" do
      stub_request(:post, "#{base_url}/turbosign/single/prepare-for-review")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: { documentId: "doc-optional", status: "review_ready" }
          }.to_json
        )

      result = client.turbo_sign.prepare_for_review(
        file_link: "https://example.com/doc.pdf",
        recipients: mock_recipients,
        fields: mock_fields,
        document_name: "Test Contract",
        document_description: "A test contract",
        sender_name: "Sales Team",
        sender_email: "sales@company.com",
        cc_emails: ["admin@company.com", "legal@company.com"]
      )

      expect(result[:documentId]).to eq("doc-optional")
    end
  end

  # ============================================
  # PrepareForSigningSingle Tests (2)
  # ============================================

  describe "#prepare_for_signing_single" do
    it "should prepare document for signing and send emails" do
      stub_request(:post, "#{base_url}/turbosign/single/prepare-for-signing")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: {
              documentId: "doc-123",
              status: "sent",
              recipients: [
                {
                  id: "rec-1",
                  name: "John Doe",
                  email: "john@example.com",
                  status: "pending",
                  signUrl: "https://sign.example.com/rec-1"
                }
              ]
            }
          }.to_json
        )

      result = client.turbo_sign.prepare_for_signing_single(
        file_link: "https://storage.example.com/contract.pdf",
        recipients: mock_recipients,
        fields: mock_fields
      )

      expect(result[:documentId]).to eq("doc-123")
      expect(result[:status]).to eq("sent")
      expect(result[:recipients]).not_to be_empty
      expect(result[:recipients][0][:signUrl]).not_to be_nil
    end

    it "should handle file upload for signing" do
      stub_request(:post, "#{base_url}/turbosign/single/prepare-for-signing")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: {
              documentId: "doc-upload",
              status: "sent",
              recipients: []
            }
          }.to_json
        )

      result = client.turbo_sign.prepare_for_signing_single(
        file: "%PDF-mock-content",
        file_name: "contract.pdf",
        recipients: mock_recipients,
        fields: mock_fields
      )

      expect(result[:documentId]).to eq("doc-upload")
    end
  end

  # ============================================
  # GetStatus Test (1)
  # ============================================

  describe "#get_status" do
    it "should get document status" do
      stub_request(:get, "#{base_url}/turbosign/documents/doc-123/status")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: {
              documentId: "doc-123",
              status: "pending",
              name: "Test Document",
              recipients: [
                { id: "rec-1", name: "John Doe", email: "john@example.com", status: "pending" }
              ],
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z"
            }
          }.to_json
        )

      result = client.turbo_sign.get_status("doc-123")

      expect(result[:documentId]).to eq("doc-123")
      expect(result[:status]).to eq("pending")
      expect(result[:name]).to eq("Test Document")
    end
  end

  # ============================================
  # Download Test (1)
  # ============================================

  describe "#download" do
    it "should download signed document" do
      pdf_content = "%PDF-mock-content"

      stub_request(:get, "#{base_url}/turbosign/documents/doc-123/download")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/pdf" },
          body: pdf_content
        )

      result = client.turbo_sign.download("doc-123")

      expect(result).to eq(pdf_content)
    end
  end

  # ============================================
  # Void Test (1)
  # ============================================

  describe "#void_document" do
    it "should void a document with reason" do
      stub_request(:post, "#{base_url}/turbosign/documents/doc-123/void")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: {
              documentId: "doc-123",
              status: "voided",
              voidedAt: "2024-01-01T12:00:00Z"
            }
          }.to_json
        )

      result = client.turbo_sign.void_document("doc-123", "Document needs revision")

      expect(result[:documentId]).to eq("doc-123")
      expect(result[:status]).to eq("voided")
    end
  end

  # ============================================
  # Resend Test (1)
  # ============================================

  describe "#resend_email" do
    it "should resend email to specific recipients" do
      stub_request(:post, "#{base_url}/turbosign/documents/doc-123/resend-email")
        .to_return(
          status: 200,
          headers: { "Content-Type" => "application/json" },
          body: {
            data: {
              documentId: "doc-123",
              message: "Emails resent successfully",
              resentAt: "2024-01-01T12:00:00Z"
            }
          }.to_json
        )

      result = client.turbo_sign.resend_email("doc-123", ["rec-1", "rec-2"])

      expect(result[:message]).to include("resent")
    end
  end

  # ============================================
  # Error Handling Tests (3)
  # ============================================

  describe "error handling" do
    it "should throw error when API key is not configured" do
      expect { TurboDocx::Client.new }.to raise_error(ArgumentError)
    end

    it "should handle API errors gracefully" do
      stub_request(:get, "#{base_url}/turbosign/documents/invalid-doc/status")
        .to_return(
          status: 404,
          headers: { "Content-Type" => "application/json" },
          body: {
            message: "Document not found",
            code: "DOCUMENT_NOT_FOUND"
          }.to_json
        )

      expect { client.turbo_sign.get_status("invalid-doc") }
        .to raise_error(TurboDocx::Error) do |error|
          expect(error.status_code).to eq(404)
          expect(error.message).to eq("Document not found")
          expect(error.code).to eq("DOCUMENT_NOT_FOUND")
        end
    end

    it "should handle validation errors" do
      stub_request(:post, "#{base_url}/turbosign/single/prepare-for-signing")
        .to_return(
          status: 400,
          headers: { "Content-Type" => "application/json" },
          body: {
            message: "Validation failed: Invalid email format",
            code: "VALIDATION_ERROR"
          }.to_json
        )

      expect do
        client.turbo_sign.prepare_for_signing_single(
          file_link: "https://example.com/doc.pdf",
          recipients: [{ name: "Test", email: "invalid-email", order: 1 }],
          fields: []
        )
      end.to raise_error(TurboDocx::Error) do |error|
        expect(error.status_code).to eq(400)
        expect(error.message).to include("Validation")
      end
    end
  end
end
