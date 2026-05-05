# frozen_string_literal: true

require "spec_helper"

RSpec.describe TurboDocxSdk::TurboPartner do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }

  let(:partner_id) { "partner-uuid-123" }
  let(:partner_api_key) { "TDXP-test-key-123" }

  before do
    described_class.instance_variable_set(:@client, nil)
    described_class.instance_variable_set(:@partner_id, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
  end

  # ============================================
  # CONFIGURATION
  # ============================================

  describe ".configure" do
    it "configures the client with partner API key" do
      described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id)
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: partner_api_key,
        base_url: nil,
        skip_sender_validation: true
      )
    end

    it "configures with custom base URL" do
      described_class.configure(
        partner_api_key: partner_api_key,
        partner_id: partner_id,
        base_url: "https://custom-api.example.com"
      )
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: partner_api_key,
        base_url: "https://custom-api.example.com",
        skip_sender_validation: true
      )
    end

    it "auto-initializes from env vars when not configured" do
      described_class.instance_variable_set(:@client, nil)
      described_class.instance_variable_set(:@partner_id, nil)

      original_key = ENV["TURBODOCX_PARTNER_API_KEY"]
      original_pid = ENV["TURBODOCX_PARTNER_ID"]
      begin
        ENV["TURBODOCX_PARTNER_API_KEY"] = "TDXP-env-key"
        ENV["TURBODOCX_PARTNER_ID"] = "env-partner-id"

        allow(mock_client).to receive(:get).and_return({ "success" => true, "data" => { "results" => [] } })

        described_class.list_organizations
        expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
          api_key: "TDXP-env-key",
          base_url: nil,
          skip_sender_validation: true
        )
      ensure
        ENV["TURBODOCX_PARTNER_API_KEY"] = original_key
        ENV["TURBODOCX_PARTNER_ID"] = original_pid
      end
    end
  end

  # ============================================
  # ORGANIZATION MANAGEMENT
  # ============================================

  describe "Organization Management" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    describe ".create_organization" do
      it "creates an organization with name only" do
        mock_response = { "success" => true, "data" => { "id" => "org-1", "name" => "Acme Corp" } }
        allow(mock_client).to receive(:post).and_return(mock_response)

        result = described_class.create_organization("name" => "Acme Corp")

        expect(result["success"]).to eq(true)
        expect(result["data"]["name"]).to eq("Acme Corp")
        expect(mock_client).to have_received(:post).with(
          "/partner/#{partner_id}/organization",
          { "name" => "Acme Corp" }
        )
      end

      it "creates an organization with metadata and features" do
        mock_response = { "success" => true, "data" => { "id" => "org-2", "name" => "Tech Corp" } }
        allow(mock_client).to receive(:post).and_return(mock_response)

        request = {
          "name" => "Tech Corp",
          "metadata" => { "industry" => "Technology" },
          "features" => { "maxUsers" => 50, "hasTDAI" => true }
        }

        described_class.create_organization(request)

        expect(mock_client).to have_received(:post).with(
          "/partner/#{partner_id}/organization",
          request
        )
      end
    end

    describe ".list_organizations" do
      it "lists organizations with default params" do
        mock_response = {
          "success" => true,
          "data" => {
            "results" => [{ "id" => "org-1", "name" => "Acme Corp" }],
            "totalRecords" => 1,
            "limit" => 50,
            "offset" => 0
          }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        result = described_class.list_organizations

        expect(result["data"]["results"].length).to eq(1)
        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/organizations",
          nil
        )
      end

      it "lists organizations with search and pagination" do
        mock_response = {
          "success" => true,
          "data" => { "results" => [], "totalRecords" => 0, "limit" => 10, "offset" => 20 }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        described_class.list_organizations("limit" => 10, "offset" => 20, "search" => "acme")

        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/organizations",
          { "limit" => "10", "offset" => "20", "search" => "acme" }
        )
      end
    end

    describe ".get_organization_details" do
      it "gets organization details with features and tracking" do
        mock_response = {
          "success" => true,
          "data" => {
            "id" => "org-1",
            "name" => "Acme Corp",
            "features" => { "maxUsers" => 50, "hasTDAI" => true },
            "tracking" => { "numUsers" => 10, "storageUsed" => 1024 }
          }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        result = described_class.get_organization_details("org-1")

        expect(result["data"]["id"]).to eq("org-1")
        expect(result["data"]["features"]["maxUsers"]).to eq(50)
        expect(result["data"]["tracking"]["numUsers"]).to eq(10)
        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/organizations/org-1"
        )
      end
    end

    describe ".update_organization_info" do
      it "updates organization name" do
        mock_response = { "success" => true, "data" => { "id" => "org-1", "name" => "New Name" } }
        allow(mock_client).to receive(:patch).and_return(mock_response)

        result = described_class.update_organization_info("org-1", "name" => "New Name")

        expect(result["data"]["name"]).to eq("New Name")
        expect(mock_client).to have_received(:patch).with(
          "/partner/#{partner_id}/organizations/org-1",
          { "name" => "New Name" }
        )
      end
    end

    describe ".delete_organization" do
      it "deletes an organization" do
        mock_response = { "success" => true, "message" => "Organization deleted" }
        allow(mock_client).to receive(:delete).and_return(mock_response)

        result = described_class.delete_organization("org-1")

        expect(result["success"]).to eq(true)
        expect(mock_client).to have_received(:delete).with(
          "/partner/#{partner_id}/organizations/org-1"
        )
      end
    end

    describe ".update_organization_entitlements" do
      it "updates features and tracking" do
        mock_response = {
          "success" => true,
          "data" => {
            "features" => { "maxUsers" => 100, "hasTDAI" => true },
            "tracking" => { "numUsers" => 10 }
          }
        }
        allow(mock_client).to receive(:patch).and_return(mock_response)

        result = described_class.update_organization_entitlements("org-1",
          "features" => { "maxUsers" => 100, "hasTDAI" => true },
          "tracking" => { "numUsers" => 10 }
        )

        expect(result["data"]["features"]["maxUsers"]).to eq(100)
        expect(mock_client).to have_received(:patch).with(
          "/partner/#{partner_id}/organizations/org-1/entitlements",
          { "features" => { "maxUsers" => 100, "hasTDAI" => true }, "tracking" => { "numUsers" => 10 } }
        )
      end
    end
  end

  # ============================================
  # ORGANIZATION USER MANAGEMENT
  # ============================================

  describe "Organization User Management" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    describe ".list_organization_users" do
      it "lists users with default params" do
        mock_response = {
          "success" => true,
          "data" => {
            "results" => [{ "id" => "user-1", "email" => "user@example.com", "role" => "admin" }],
            "totalRecords" => 1,
            "limit" => 50,
            "offset" => 0
          }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        result = described_class.list_organization_users("org-1")

        expect(result["data"]["results"].length).to eq(1)
        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/organizations/org-1/users",
          nil
        )
      end

      it "lists users with pagination and search" do
        mock_response = {
          "success" => true,
          "data" => { "results" => [], "totalRecords" => 0, "limit" => 10, "offset" => 0 }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        described_class.list_organization_users("org-1", "limit" => 10, "search" => "john")

        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/organizations/org-1/users",
          { "limit" => "10", "search" => "john" }
        )
      end
    end

    describe ".add_user_to_organization" do
      it "adds a user to an organization" do
        mock_response = {
          "success" => true,
          "data" => { "id" => "user-1", "email" => "user@example.com", "role" => "contributor" }
        }
        allow(mock_client).to receive(:post).and_return(mock_response)

        result = described_class.add_user_to_organization("org-1",
          "email" => "user@example.com",
          "role" => "contributor"
        )

        expect(result["data"]["email"]).to eq("user@example.com")
        expect(mock_client).to have_received(:post).with(
          "/partner/#{partner_id}/organizations/org-1/users",
          { "email" => "user@example.com", "role" => "contributor" }
        )
      end
    end

    describe ".update_organization_user_role" do
      it "updates a user role" do
        mock_response = {
          "success" => true,
          "data" => { "id" => "user-1", "email" => "user@example.com", "role" => "admin" }
        }
        allow(mock_client).to receive(:patch).and_return(mock_response)

        result = described_class.update_organization_user_role("org-1", "user-1", "role" => "admin")

        expect(result["data"]["role"]).to eq("admin")
        expect(mock_client).to have_received(:patch).with(
          "/partner/#{partner_id}/organizations/org-1/users/user-1",
          { "role" => "admin" }
        )
      end
    end

    describe ".remove_user_from_organization" do
      it "removes a user from an organization" do
        mock_response = { "success" => true, "message" => "User removed" }
        allow(mock_client).to receive(:delete).and_return(mock_response)

        result = described_class.remove_user_from_organization("org-1", "user-1")

        expect(result["success"]).to eq(true)
        expect(mock_client).to have_received(:delete).with(
          "/partner/#{partner_id}/organizations/org-1/users/user-1"
        )
      end
    end

    describe ".resend_organization_invitation_to_user" do
      it "resends an invitation" do
        mock_response = { "success" => true, "message" => "Invitation resent" }
        allow(mock_client).to receive(:post).and_return(mock_response)

        result = described_class.resend_organization_invitation_to_user("org-1", "user-1")

        expect(result["success"]).to eq(true)
        expect(mock_client).to have_received(:post).with(
          "/partner/#{partner_id}/organizations/org-1/users/user-1/resend-invitation"
        )
      end
    end
  end

  # ============================================
  # ORGANIZATION API KEY MANAGEMENT
  # ============================================

  describe "Organization API Key Management" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    describe ".list_organization_api_keys" do
      it "lists API keys with default params" do
        mock_response = {
          "success" => true,
          "data" => {
            "results" => [{ "id" => "key-1", "name" => "Production Key", "role" => "admin" }],
            "totalRecords" => 1,
            "limit" => 50,
            "offset" => 0
          }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        result = described_class.list_organization_api_keys("org-1")

        expect(result["data"]["results"].length).to eq(1)
        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/organizations/org-1/apikeys",
          nil
        )
      end

      it "lists API keys with search" do
        mock_response = {
          "success" => true,
          "data" => { "results" => [], "totalRecords" => 0, "limit" => 50, "offset" => 0 }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        described_class.list_organization_api_keys("org-1", "search" => "prod")

        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/organizations/org-1/apikeys",
          { "search" => "prod" }
        )
      end
    end

    describe ".create_organization_api_key" do
      it "creates an API key" do
        mock_response = {
          "success" => true,
          "data" => { "id" => "key-1", "name" => "New Key", "key" => "TDX-full-key-value", "role" => "admin" },
          "message" => "API key created"
        }
        allow(mock_client).to receive(:post).and_return(mock_response)

        result = described_class.create_organization_api_key("org-1",
          "name" => "New Key",
          "role" => "admin"
        )

        expect(result["data"]["key"]).to eq("TDX-full-key-value")
        expect(mock_client).to have_received(:post).with(
          "/partner/#{partner_id}/organizations/org-1/apikeys",
          { "name" => "New Key", "role" => "admin" }
        )
      end
    end

    describe ".update_organization_api_key" do
      it "updates an API key" do
        mock_response = {
          "success" => true,
          "message" => "API key updated successfully",
          "apiKey" => { "id" => "key-1", "name" => "Updated Key", "role" => "admin", "updatedOn" => "2025-06-01T00:00:00Z" }
        }
        allow(mock_client).to receive(:patch).and_return(mock_response)

        result = described_class.update_organization_api_key("org-1", "key-1", "name" => "Updated Key")

        expect(result["apiKey"]["name"]).to eq("Updated Key")
        expect(result["message"]).to eq("API key updated successfully")
        expect(mock_client).to have_received(:patch).with(
          "/partner/#{partner_id}/organizations/org-1/apikeys/key-1",
          { "name" => "Updated Key" }
        )
      end
    end

    describe ".revoke_organization_api_key" do
      it "revokes an API key" do
        mock_response = { "success" => true, "message" => "API key revoked" }
        allow(mock_client).to receive(:delete).and_return(mock_response)

        result = described_class.revoke_organization_api_key("org-1", "key-1")

        expect(result["success"]).to eq(true)
        expect(mock_client).to have_received(:delete).with(
          "/partner/#{partner_id}/organizations/org-1/apikeys/key-1"
        )
      end
    end
  end

  # ============================================
  # PARTNER API KEY MANAGEMENT
  # ============================================

  describe "Partner API Key Management" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    describe ".list_partner_api_keys" do
      it "lists partner API keys" do
        mock_response = {
          "success" => true,
          "data" => {
            "results" => [{ "id" => "pkey-1", "name" => "Partner Key", "scopes" => ["org:create", "org:read"] }],
            "totalRecords" => 1,
            "limit" => 50,
            "offset" => 0
          }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        result = described_class.list_partner_api_keys

        expect(result["data"]["results"].length).to eq(1)
        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/api-keys",
          nil
        )
      end

      it "lists partner API keys with pagination" do
        mock_response = {
          "success" => true,
          "data" => { "results" => [], "totalRecords" => 0, "limit" => 10, "offset" => 5 }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        described_class.list_partner_api_keys("limit" => 10, "offset" => 5)

        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/api-keys",
          { "limit" => "10", "offset" => "5" }
        )
      end
    end

    describe ".create_partner_api_key" do
      it "creates a partner API key with scopes" do
        mock_response = {
          "success" => true,
          "data" => {
            "id" => "pkey-1",
            "name" => "CI Key",
            "key" => "TDXP-full-key-value",
            "scopes" => ["org:create", "org:read"],
            "description" => "For CI/CD"
          },
          "message" => "Partner API key created"
        }
        allow(mock_client).to receive(:post).and_return(mock_response)

        result = described_class.create_partner_api_key(
          "name" => "CI Key",
          "scopes" => ["org:create", "org:read"],
          "description" => "For CI/CD"
        )

        expect(result["data"]["key"]).to eq("TDXP-full-key-value")
        expect(mock_client).to have_received(:post).with(
          "/partner/#{partner_id}/api-keys",
          { "name" => "CI Key", "scopes" => ["org:create", "org:read"], "description" => "For CI/CD" }
        )
      end
    end

    describe ".update_partner_api_key" do
      it "updates a partner API key" do
        mock_response = {
          "success" => true,
          "message" => "Partner API key updated successfully",
          "apiKey" => { "id" => "pkey-1", "name" => "Updated Name", "scopes" => ["org:create"], "updatedOn" => "2025-06-01T00:00:00Z" }
        }
        allow(mock_client).to receive(:patch).and_return(mock_response)

        result = described_class.update_partner_api_key("pkey-1",
          "name" => "Updated Name",
          "scopes" => ["org:create"]
        )

        expect(result["apiKey"]["name"]).to eq("Updated Name")
        expect(result["message"]).to eq("Partner API key updated successfully")
        expect(mock_client).to have_received(:patch).with(
          "/partner/#{partner_id}/api-keys/pkey-1",
          { "name" => "Updated Name", "scopes" => ["org:create"] }
        )
      end
    end

    describe ".revoke_partner_api_key" do
      it "revokes a partner API key" do
        mock_response = { "success" => true, "message" => "Partner API key revoked" }
        allow(mock_client).to receive(:delete).and_return(mock_response)

        result = described_class.revoke_partner_api_key("pkey-1")

        expect(result["success"]).to eq(true)
        expect(mock_client).to have_received(:delete).with(
          "/partner/#{partner_id}/api-keys/pkey-1"
        )
      end
    end
  end

  # ============================================
  # PARTNER USER MANAGEMENT
  # ============================================

  describe "Partner User Management" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    describe ".list_partner_portal_users" do
      it "lists partner users" do
        mock_response = {
          "success" => true,
          "data" => {
            "results" => [{ "id" => "puser-1", "email" => "admin@partner.com", "role" => "admin" }],
            "totalRecords" => 1,
            "limit" => 50,
            "offset" => 0
          }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        result = described_class.list_partner_portal_users

        expect(result["data"]["results"].length).to eq(1)
        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/users",
          nil
        )
      end

      it "lists partner users with search" do
        mock_response = {
          "success" => true,
          "data" => { "results" => [], "totalRecords" => 0, "limit" => 50, "offset" => 0 }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        described_class.list_partner_portal_users("search" => "admin")

        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/users",
          { "search" => "admin" }
        )
      end
    end

    describe ".add_user_to_partner_portal" do
      it "adds a user with permissions" do
        mock_permissions = {
          "canManageOrgs" => true,
          "canManageOrgUsers" => true,
          "canManagePartnerUsers" => false,
          "canManageOrgAPIKeys" => true,
          "canManagePartnerAPIKeys" => false,
          "canUpdateEntitlements" => true,
          "canViewAuditLogs" => true
        }
        mock_response = {
          "success" => true,
          "data" => {
            "id" => "puser-1",
            "email" => "admin@partner.com",
            "role" => "admin",
            "permissions" => mock_permissions
          }
        }
        allow(mock_client).to receive(:post).and_return(mock_response)

        result = described_class.add_user_to_partner_portal(
          "email" => "admin@partner.com",
          "role" => "admin",
          "permissions" => mock_permissions
        )

        expect(result["data"]["email"]).to eq("admin@partner.com")
        expect(result["data"]["permissions"]["canManageOrgs"]).to eq(true)
        expect(mock_client).to have_received(:post).with(
          "/partner/#{partner_id}/users",
          { "email" => "admin@partner.com", "role" => "admin", "permissions" => mock_permissions }
        )
      end
    end

    describe ".update_partner_user_permissions" do
      it "updates partner user role and permissions" do
        mock_response = {
          "success" => true,
          "data" => {
            "userId" => "puser-1",
            "role" => "member",
            "permissions" => { "canManageOrgs" => false }
          }
        }
        allow(mock_client).to receive(:patch).and_return(mock_response)

        result = described_class.update_partner_user_permissions("puser-1",
          "role" => "member",
          "permissions" => { "canManageOrgs" => false }
        )

        expect(result["data"]["userId"]).to eq("puser-1")
        expect(result["data"]["role"]).to eq("member")
        expect(mock_client).to have_received(:patch).with(
          "/partner/#{partner_id}/users/puser-1",
          { "role" => "member", "permissions" => { "canManageOrgs" => false } }
        )
      end
    end

    describe ".remove_user_from_partner_portal" do
      it "removes a partner user" do
        mock_response = { "success" => true, "message" => "User removed" }
        allow(mock_client).to receive(:delete).and_return(mock_response)

        result = described_class.remove_user_from_partner_portal("puser-1")

        expect(result["success"]).to eq(true)
        expect(mock_client).to have_received(:delete).with(
          "/partner/#{partner_id}/users/puser-1"
        )
      end
    end

    describe ".resend_partner_portal_invitation_to_user" do
      it "resends a partner portal invitation" do
        mock_response = { "success" => true, "message" => "Invitation resent" }
        allow(mock_client).to receive(:post).and_return(mock_response)

        result = described_class.resend_partner_portal_invitation_to_user("puser-1")

        expect(result["success"]).to eq(true)
        expect(mock_client).to have_received(:post).with(
          "/partner/#{partner_id}/users/puser-1/resend-invitation"
        )
      end
    end
  end

  # ============================================
  # AUDIT LOGS
  # ============================================

  describe "Audit Logs" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    describe ".get_partner_audit_logs" do
      it "gets audit logs with default params" do
        mock_response = {
          "success" => true,
          "data" => {
            "results" => [
              {
                "id" => "log-1",
                "partnerId" => partner_id,
                "action" => "org.created",
                "resourceType" => "organization",
                "resourceId" => "org-1",
                "success" => true,
                "createdOn" => "2025-06-01T10:00:00Z"
              }
            ],
            "totalRecords" => 1,
            "limit" => 50,
            "offset" => 0
          }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        result = described_class.get_partner_audit_logs

        expect(result["data"]["results"].length).to eq(1)
        expect(result["data"]["results"][0]["action"]).to eq("org.created")
        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/audit-logs",
          nil
        )
      end

      it "gets audit logs with filters" do
        mock_response = {
          "success" => true,
          "data" => { "results" => [], "totalRecords" => 0, "limit" => 10, "offset" => 0 }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        described_class.get_partner_audit_logs(
          "limit" => 10,
          "action" => "org.created",
          "resourceType" => "organization",
          "success" => true,
          "startDate" => "2025-01-01",
          "endDate" => "2025-12-31"
        )

        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/audit-logs",
          {
            "limit" => "10",
            "action" => "org.created",
            "resourceType" => "organization",
            "success" => "true",
            "startDate" => "2025-01-01",
            "endDate" => "2025-12-31"
          }
        )
      end

      it "serializes boolean success=false as string" do
        mock_response = {
          "success" => true,
          "data" => { "results" => [], "totalRecords" => 0, "limit" => 50, "offset" => 0 }
        }
        allow(mock_client).to receive(:get).and_return(mock_response)

        described_class.get_partner_audit_logs("success" => false)

        expect(mock_client).to have_received(:get).with(
          "/partner/#{partner_id}/audit-logs",
          { "success" => "false" }
        )
      end
    end
  end

  # ============================================
  # QUERY PARAMETER HANDLING
  # ============================================

  describe "Query Parameter Handling" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    it "filters out nil values from query params" do
      mock_response = {
        "success" => true,
        "data" => { "results" => [], "totalRecords" => 0, "limit" => 50, "offset" => 0 }
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.list_organizations("limit" => 10, "offset" => nil, "search" => nil)

      expect(mock_client).to have_received(:get).with(
        "/partner/#{partner_id}/organizations",
        { "limit" => "10" }
      )
    end

    it "passes nil when no query params are provided" do
      mock_response = {
        "success" => true,
        "data" => { "results" => [], "totalRecords" => 0, "limit" => 50, "offset" => 0 }
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.list_organizations

      expect(mock_client).to have_received(:get).with(
        "/partner/#{partner_id}/organizations",
        nil
      )
    end

    it "converts numeric values to strings" do
      mock_response = {
        "success" => true,
        "data" => { "results" => [], "totalRecords" => 0, "limit" => 25, "offset" => 50 }
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.list_organization_users("org-1", "limit" => 25, "offset" => 50)

      expect(mock_client).to have_received(:get).with(
        "/partner/#{partner_id}/organizations/org-1/users",
        { "limit" => "25", "offset" => "50" }
      )
    end
  end

  # ============================================
  # RESPONSE PARSING
  # ============================================

  describe "Response Parsing" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    it "parses organization response with all optional fields" do
      mock_response = {
        "success" => true,
        "data" => {
          "id" => "org-1",
          "name" => "Full Org",
          "partnerId" => partner_id,
          "createdOn" => "2025-01-01T00:00:00Z",
          "updatedOn" => "2025-06-01T00:00:00Z",
          "createdBy" => "admin-user",
          "isActive" => true,
          "userCount" => 42,
          "storageUsed" => 1_073_741_824,
          "metadata" => { "plan" => "enterprise" }
        }
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.get_organization_details("org-1")

      expect(result["data"]["partnerId"]).to eq(partner_id)
      expect(result["data"]["isActive"]).to eq(true)
      expect(result["data"]["userCount"]).to eq(42)
      expect(result["data"]["metadata"]["plan"]).to eq("enterprise")
    end

    it "parses audit log entries with all fields" do
      mock_response = {
        "success" => true,
        "data" => {
          "results" => [
            {
              "id" => "log-1",
              "partnerId" => partner_id,
              "partnerAPIKeyId" => "pkey-1",
              "action" => "org.created",
              "resourceType" => "organization",
              "resourceId" => "org-1",
              "details" => { "orgName" => "Acme Corp" },
              "success" => true,
              "ipAddress" => "192.168.1.1",
              "userAgent" => "SDK/1.0",
              "createdOn" => "2025-06-01T10:00:00Z"
            }
          ],
          "totalRecords" => 1,
          "limit" => 50,
          "offset" => 0
        }
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.get_partner_audit_logs

      entry = result["data"]["results"][0]
      expect(entry["partnerAPIKeyId"]).to eq("pkey-1")
      expect(entry["details"]["orgName"]).to eq("Acme Corp")
      expect(entry["ipAddress"]).to eq("192.168.1.1")
      expect(entry["userAgent"]).to eq("SDK/1.0")
    end

    it "parses organization user response with optional fields" do
      mock_response = {
        "success" => true,
        "data" => {
          "id" => "user-1",
          "email" => "user@example.com",
          "firstName" => "John",
          "lastName" => "Doe",
          "ssoId" => "sso-123",
          "role" => "admin",
          "createdOn" => "2025-01-01T00:00:00Z",
          "isActive" => true
        }
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.add_user_to_organization("org-1",
        "email" => "user@example.com",
        "role" => "admin"
      )

      expect(result["data"]["firstName"]).to eq("John")
      expect(result["data"]["lastName"]).to eq("Doe")
      expect(result["data"]["ssoId"]).to eq("sso-123")
    end

    it "parses features with all 26 fields" do
      all_features = {
        "orgId" => "org-1",
        "maxUsers" => 100,
        "maxProjectspaces" => 50,
        "maxTemplates" => 200,
        "maxStorage" => 10_737_418_240,
        "maxGeneratedDeliverables" => 1000,
        "maxSignatures" => 500,
        "maxAICredits" => 10_000,
        "rdWatermark" => false,
        "hasFileDownload" => true,
        "hasAdvancedDateFormats" => true,
        "hasGDrive" => true,
        "hasSharepoint" => true,
        "hasSharepointOnly" => false,
        "hasTDAI" => true,
        "hasPptx" => true,
        "hasTDWriter" => true,
        "hasSalesforce" => false,
        "hasWrike" => false,
        "hasVariableStack" => true,
        "hasSubvariables" => true,
        "hasZapier" => true,
        "hasBYOM" => false,
        "hasBYOVS" => false,
        "hasBetaFeatures" => false,
        "enableBulkSending" => true,
        "createdBy" => "admin"
      }

      mock_response = {
        "success" => true,
        "data" => {
          "features" => all_features,
          "tracking" => {
            "numUsers" => 42,
            "numProjectspaces" => 10,
            "numTemplates" => 50,
            "storageUsed" => 1_073_741_824,
            "numGeneratedDeliverables" => 100,
            "numSignaturesUsed" => 25,
            "currentAICredits" => 9500
          }
        }
      }
      allow(mock_client).to receive(:patch).and_return(mock_response)

      result = described_class.update_organization_entitlements("org-1",
        "features" => all_features
      )

      expect(result["data"]["features"]["maxUsers"]).to eq(100)
      expect(result["data"]["features"]["hasTDAI"]).to eq(true)
      expect(result["data"]["features"]["enableBulkSending"]).to eq(true)
      expect(result["data"]["tracking"]["numUsers"]).to eq(42)
      expect(result["data"]["tracking"]["currentAICredits"]).to eq(9500)
    end

    it "handles OrgUserListResponse with userLimit" do
      mock_response = {
        "success" => true,
        "data" => {
          "results" => [{ "id" => "user-1", "email" => "user@example.com" }],
          "totalRecords" => 1,
          "limit" => 50,
          "offset" => 0
        },
        "userLimit" => { "max" => 25, "current" => 2 }
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_organization_users("org-1")

      expect(result["userLimit"]).to eq({ "max" => 25, "current" => 2 })
    end

    it "handles minimal response with only required fields" do
      mock_response = {
        "success" => true,
        "data" => { "id" => "org-1", "name" => "Minimal Org" }
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.create_organization("name" => "Minimal Org")

      expect(result["data"]["id"]).to eq("org-1")
      expect(result["data"]["partnerId"]).to be_nil
      expect(result["data"]["metadata"]).to be_nil
    end
  end

  # ============================================
  # ERROR HANDLING
  # ============================================

  describe "Error Handling" do
    before { described_class.configure(partner_api_key: partner_api_key, partner_id: partner_id) }

    it "propagates API errors from GET" do
      allow(mock_client).to receive(:get).and_raise(TurboDocxSdk::NotFoundError, "Not Found")

      expect {
        described_class.get_organization_details("nonexistent")
      }.to raise_error(TurboDocxSdk::NotFoundError, "Not Found")
    end

    it "propagates validation errors from POST" do
      allow(mock_client).to receive(:post).and_raise(TurboDocxSdk::ValidationError, "Name is required")

      expect {
        described_class.create_organization("name" => "")
      }.to raise_error(TurboDocxSdk::ValidationError, "Name is required")
    end

    it "propagates authentication errors" do
      allow(mock_client).to receive(:get).and_raise(TurboDocxSdk::AuthenticationError, "Invalid API key")

      expect {
        described_class.list_organizations
      }.to raise_error(TurboDocxSdk::AuthenticationError, "Invalid API key")
    end

    it "propagates errors from PATCH" do
      allow(mock_client).to receive(:patch).and_raise(TurboDocxSdk::TurboDocxError.new("Forbidden", status_code: 403))

      expect {
        described_class.update_organization_info("org-1", "name" => "New Name")
      }.to raise_error(TurboDocxSdk::TurboDocxError, "Forbidden")
    end

    it "propagates errors from DELETE" do
      allow(mock_client).to receive(:delete).and_raise(TurboDocxSdk::NotFoundError, "Organization not found")

      expect {
        described_class.delete_organization("nonexistent")
      }.to raise_error(TurboDocxSdk::NotFoundError, "Organization not found")
    end
  end
end
