# frozen_string_literal: true

require "spec_helper"
require_relative "../lib/turbodocx_sdk/deliverable"

RSpec.describe TurboDocxSdk::Deliverable do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }

  before do
    described_class.instance_variable_set(:@client, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
  end

  # ============================================
  # CONFIGURATION
  # ============================================

  describe ".configure" do
    it "configures the client with API key and org id (skipping sender validation)" do
      described_class.configure(
        api_key: "test-api-key",
        org_id: "test-org-id"
      )
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "test-api-key",
        access_token: nil,
        org_id: "test-org-id",
        base_url: nil,
        skip_sender_validation: true
      )
    end

    it "configures with custom base URL" do
      described_class.configure(
        api_key: "test-api-key",
        org_id: "test-org-id",
        base_url: "https://custom-api.example.com"
      )
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "test-api-key",
        access_token: nil,
        org_id: "test-org-id",
        base_url: "https://custom-api.example.com",
        skip_sender_validation: true
      )
    end

    it "configures with access token instead of API key" do
      described_class.configure(
        access_token: "oauth-token",
        org_id: "org-123"
      )
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: nil,
        access_token: "oauth-token",
        org_id: "org-123",
        base_url: nil,
        skip_sender_validation: true
      )
    end

    it "delegates to HttpClient's env fallback when not configured (passes no explicit credentials)" do
      # Deliverable.get_client constructs HttpClient with NO api_key/org_id, so
      # HttpClient reads them from TURBODOCX_API_KEY / TURBODOCX_ORG_ID itself
      # (that env-read behavior is covered in http_client_spec.rb). Here we
      # assert the delegation contract: the only kwarg passed is
      # skip_sender_validation: true, leaving credentials to the env fallback.
      allow(mock_client).to receive(:get).and_return({ "results" => [], "totalRecords" => 0 })

      described_class.list_deliverables
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(skip_sender_validation: true)
    end
  end

  # ============================================
  # listDeliverables
  # ============================================

  describe ".list_deliverables" do
    before do
      described_class.configure(api_key: "test-key", org_id: "org-1")
    end

    it "lists deliverables without options" do
      mock_response = {
        "results" => [{ "id" => "del-1", "name" => "Contract" }],
        "totalRecords" => 1
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_deliverables

      expect(result["results"].length).to eq(1)
      expect(result["totalRecords"]).to eq(1)
      expect(mock_client).to have_received(:get).with("/v1/deliverable", {})
    end

    it "passes pagination, query, and showTags params" do
      mock_response = { "results" => [], "totalRecords" => 0 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.list_deliverables(
        limit: 10,
        offset: 20,
        query: "contract",
        show_tags: true
      )

      expect(mock_client).to have_received(:get).with(
        "/v1/deliverable",
        { limit: 10, offset: 20, query: "contract", showTags: true }
      )
    end

    it "accepts string keys for options" do
      mock_response = { "results" => [], "totalRecords" => 0 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.list_deliverables("limit" => 5, "showTags" => false)

      expect(mock_client).to have_received(:get).with(
        "/v1/deliverable",
        { limit: 5, showTags: false }
      )
    end
  end

  # ============================================
  # generateDeliverable
  # ============================================

  describe ".generate_deliverable" do
    before do
      described_class.configure(api_key: "test-key", org_id: "org-1")
    end

    it "generates a deliverable from a template" do
      mock_response = {
        "results" => { "deliverable" => { "id" => "del-new", "name" => "Employee Contract" } }
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      request = {
        "templateId" => "tmpl-123",
        "name" => "Employee Contract",
        "variables" => [
          { "placeholder" => "{EmployeeName}", "text" => "John Smith", "mimeType" => "text" }
        ],
        "tags" => ["hr", "contract"]
      }

      result = described_class.generate_deliverable(request)

      expect(result["results"]["deliverable"]["id"]).to eq("del-new")
      expect(mock_client).to have_received(:post).with("/v1/deliverable", request)
    end
  end

  # ============================================
  # getDeliverableDetails
  # ============================================

  describe ".get_deliverable_details" do
    before do
      described_class.configure(api_key: "test-key", org_id: "org-1")
    end

    it "gets details and unwraps the results key" do
      mock_response = {
        "results" => {
          "id" => "del-1",
          "name" => "Contract",
          "variables" => [{ "placeholder" => "{Name}", "text" => "Jane" }]
        }
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.get_deliverable_details("del-1")

      expect(result["id"]).to eq("del-1")
      expect(result["name"]).to eq("Contract")
      expect(result["variables"].length).to eq(1)
      expect(mock_client).to have_received(:get).with("/v1/deliverable/del-1", {})
    end

    it "passes showTags option" do
      mock_response = { "results" => { "id" => "del-1", "tags" => [] } }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.get_deliverable_details("del-1", show_tags: true)

      expect(mock_client).to have_received(:get).with(
        "/v1/deliverable/del-1",
        { showTags: true }
      )
    end
  end

  # ============================================
  # updateDeliverableInfo
  # ============================================

  describe ".update_deliverable_info" do
    before do
      described_class.configure(api_key: "test-key", org_id: "org-1")
    end

    it "updates name, description, and tags" do
      mock_response = {
        "message" => "Deliverable updated successfully",
        "deliverableId" => "del-1"
      }
      allow(mock_client).to receive(:patch).and_return(mock_response)

      request = {
        "name" => "Contract (Final)",
        "tags" => ["hr", "contract", "finalized"]
      }

      result = described_class.update_deliverable_info("del-1", request)

      expect(result["message"]).to eq("Deliverable updated successfully")
      expect(result["deliverableId"]).to eq("del-1")
      expect(mock_client).to have_received(:patch).with("/v1/deliverable/del-1", request)
    end
  end

  # ============================================
  # deleteDeliverable
  # ============================================

  describe ".delete_deliverable" do
    before do
      described_class.configure(api_key: "test-key", org_id: "org-1")
    end

    it "soft-deletes a deliverable" do
      mock_response = {
        "message" => "Deliverable deleted successfully",
        "deliverableId" => "del-1"
      }
      allow(mock_client).to receive(:delete).and_return(mock_response)

      result = described_class.delete_deliverable("del-1")

      expect(result["message"]).to eq("Deliverable deleted successfully")
      expect(result["deliverableId"]).to eq("del-1")
      expect(mock_client).to have_received(:delete).with("/v1/deliverable/del-1")
    end
  end

  # ============================================
  # downloadSourceFile
  # ============================================

  describe ".download_source_file" do
    before do
      described_class.configure(api_key: "test-key", org_id: "org-1")
    end

    it "downloads the raw source file bytes" do
      allow(mock_client).to receive(:get_raw).and_return("fake-docx-bytes")

      result = described_class.download_source_file("del-1")

      expect(result).to eq("fake-docx-bytes")
      expect(mock_client).to have_received(:get_raw).with("/v1/deliverable/file/del-1")
    end
  end

  # ============================================
  # downloadPDF
  # ============================================

  describe ".download_pdf" do
    before do
      described_class.configure(api_key: "test-key", org_id: "org-1")
    end

    it "downloads the raw PDF bytes" do
      allow(mock_client).to receive(:get_raw).and_return("fake-pdf-bytes")

      result = described_class.download_pdf("del-1")

      expect(result).to eq("fake-pdf-bytes")
      expect(mock_client).to have_received(:get_raw).with("/v1/deliverable/file/pdf/del-1")
    end
  end

  # ============================================
  # ERROR HANDLING
  # ============================================

  describe "Error Handling" do
    before do
      described_class.configure(api_key: "test-key", org_id: "org-1")
    end

    it "propagates not found errors" do
      allow(mock_client).to receive(:get).and_raise(TurboDocxSdk::NotFoundError, "Deliverable not found")

      expect {
        described_class.get_deliverable_details("invalid-id")
      }.to raise_error(TurboDocxSdk::NotFoundError, "Deliverable not found")
    end

    it "propagates validation errors" do
      allow(mock_client).to receive(:post).and_raise(TurboDocxSdk::ValidationError, "name is required")

      expect {
        described_class.generate_deliverable("templateId" => "t-1", "variables" => [])
      }.to raise_error(TurboDocxSdk::ValidationError, "name is required")
    end

    it "propagates rate limit errors" do
      allow(mock_client).to receive(:get).and_raise(TurboDocxSdk::RateLimitError, "Rate limit exceeded")

      expect {
        described_class.list_deliverables
      }.to raise_error(TurboDocxSdk::RateLimitError, "Rate limit exceeded")
    end
  end
end
