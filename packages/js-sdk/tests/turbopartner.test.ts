/**
 * TurboPartner Module Tests
 *
 * Tests for all TurboPartner operations across 6 functional areas:
 * - Organization Management (6 methods)
 * - Organization User Management (5 methods)
 * - Organization API Key Management (4 methods)
 * - Partner API Key Management (4 methods)
 * - Partner User Management (5 methods)
 * - Audit Logs (1 method)
 *
 * Plus query parameter handling, response parsing, and error handling tests.
 */

import { TurboPartner } from "../src/modules/partner";
import { HttpClient } from "../src/http";
import type {
  CreateOrganizationRequest,
  PartnerPermissions,
  Features,
} from "../src/types/partner";

// Mock the HttpClient
jest.mock("../src/http");

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

const PARTNER_ID = "partner-uuid-123";
const PARTNER_API_KEY = "TDXP-test-key-123";

/** Helper: set up mocks and configure TurboPartner */
function setup() {
  (TurboPartner as any).client = undefined;
  (TurboPartner as any).partnerId = undefined;
  TurboPartner.configure({
    partnerApiKey: PARTNER_API_KEY,
    partnerId: PARTNER_ID,
  });
}

describe("TurboPartner Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TurboPartner as any).client = undefined;
    (TurboPartner as any).partnerId = undefined;
  });

  // ============================================
  // CONFIGURATION
  // ============================================

  describe("configure", () => {
    it("should configure the client with partner API key", () => {
      TurboPartner.configure({
        partnerApiKey: PARTNER_API_KEY,
        partnerId: PARTNER_ID,
      });

      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: PARTNER_API_KEY,
        baseUrl: undefined,
        skipSenderValidation: true,
      });
    });

    it("should configure with custom base URL", () => {
      TurboPartner.configure({
        partnerApiKey: PARTNER_API_KEY,
        partnerId: PARTNER_ID,
        baseUrl: "https://custom-api.example.com",
      });

      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: PARTNER_API_KEY,
        baseUrl: "https://custom-api.example.com",
        skipSenderValidation: true,
      });
    });
  });

  // ============================================
  // ORGANIZATION MANAGEMENT
  // ============================================

  describe("Organization Management", () => {
    describe("createOrganization", () => {
      it("should create an organization with name only", async () => {
        const mockResponse = {
          success: true,
          data: { id: "org-1", name: "Acme Corp" },
        };
        MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.createOrganization({ name: "Acme Corp" });

        expect(result.success).toBe(true);
        expect(result.data.name).toBe("Acme Corp");
        expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organization`,
          { name: "Acme Corp" }
        );
      });

      it("should create an organization with metadata and features", async () => {
        const mockResponse = {
          success: true,
          data: { id: "org-2", name: "Tech Corp" },
        };
        MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const request: CreateOrganizationRequest = {
          name: "Tech Corp",
          metadata: { industry: "Technology" },
          features: { maxUsers: 50, hasTDAI: true },
        };

        await TurboPartner.createOrganization(request);

        expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organization`,
          request
        );
      });
    });

    describe("listOrganizations", () => {
      it("should list organizations with default params", async () => {
        const mockResponse = {
          success: true,
          data: {
            results: [{ id: "org-1", name: "Acme Corp" }],
            totalRecords: 1,
            limit: 50,
            offset: 0,
          },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.listOrganizations();

        expect(result.data.results).toHaveLength(1);
        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations`,
          undefined
        );
      });

      it("should list organizations with search and pagination", async () => {
        const mockResponse = {
          success: true,
          data: { results: [], totalRecords: 0, limit: 10, offset: 20 },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        await TurboPartner.listOrganizations({ limit: 10, offset: 20, search: "acme" });

        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations`,
          { limit: "10", offset: "20", search: "acme" }
        );
      });
    });

    describe("getOrganizationDetails", () => {
      it("should get organization details with features and tracking", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: "org-1",
            name: "Acme Corp",
            features: { maxUsers: 50, hasTDAI: true },
            tracking: { numUsers: 10, storageUsed: 1024 },
          },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.getOrganizationDetails("org-1");

        expect(result.data.id).toBe("org-1");
        expect(result.data.features?.maxUsers).toBe(50);
        expect(result.data.tracking?.numUsers).toBe(10);
        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1`
        );
      });
    });

    describe("updateOrganizationInfo", () => {
      it("should update organization name", async () => {
        const mockResponse = {
          success: true,
          data: { id: "org-1", name: "New Name" },
        };
        MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.updateOrganizationInfo("org-1", { name: "New Name" });

        expect(result.data.name).toBe("New Name");
        expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1`,
          { name: "New Name" }
        );
      });
    });

    describe("deleteOrganization", () => {
      it("should delete an organization", async () => {
        const mockResponse = { success: true, message: "Organization deleted" };
        MockedHttpClient.prototype.delete = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.deleteOrganization("org-1");

        expect(result.success).toBe(true);
        expect(MockedHttpClient.prototype.delete).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1`
        );
      });
    });

    describe("updateOrganizationEntitlements", () => {
      it("should update features and tracking", async () => {
        const mockResponse = {
          success: true,
          data: {
            features: { maxUsers: 100, hasTDAI: true },
            tracking: { numUsers: 10 },
          },
        };
        MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.updateOrganizationEntitlements("org-1", {
          features: { maxUsers: 100, hasTDAI: true },
          tracking: { numUsers: 10 },
        });

        expect(result.data.features?.maxUsers).toBe(100);
        expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/entitlements`,
          { features: { maxUsers: 100, hasTDAI: true }, tracking: { numUsers: 10 } }
        );
      });
    });
  });

  // ============================================
  // ORGANIZATION USER MANAGEMENT
  // ============================================

  describe("Organization User Management", () => {
    describe("listOrganizationUsers", () => {
      it("should list users with default params", async () => {
        const mockResponse = {
          success: true,
          data: {
            results: [{ id: "user-1", email: "user@example.com", role: "admin" }],
            totalRecords: 1,
            limit: 50,
            offset: 0,
          },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.listOrganizationUsers("org-1");

        expect(result.data.results).toHaveLength(1);
        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/users`,
          undefined
        );
      });

      it("should list users with pagination and search", async () => {
        const mockResponse = {
          success: true,
          data: { results: [], totalRecords: 0, limit: 10, offset: 0 },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        await TurboPartner.listOrganizationUsers("org-1", { limit: 10, search: "john" });

        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/users`,
          { limit: "10", search: "john" }
        );
      });
    });

    describe("addUserToOrganization", () => {
      it("should add a user to an organization", async () => {
        const mockResponse = {
          success: true,
          data: { id: "user-1", email: "user@example.com", role: "contributor" },
        };
        MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.addUserToOrganization("org-1", {
          email: "user@example.com",
          role: "contributor",
        });

        expect(result.data.email).toBe("user@example.com");
        expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/users`,
          { email: "user@example.com", role: "contributor" }
        );
      });
    });

    describe("updateOrganizationUserRole", () => {
      it("should update a user role", async () => {
        const mockResponse = {
          success: true,
          data: { id: "user-1", email: "user@example.com", role: "admin" },
        };
        MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.updateOrganizationUserRole("org-1", "user-1", {
          role: "admin",
        });

        expect(result.data.role).toBe("admin");
        expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/users/user-1`,
          { role: "admin" }
        );
      });
    });

    describe("removeUserFromOrganization", () => {
      it("should remove a user from an organization", async () => {
        const mockResponse = { success: true, message: "User removed" };
        MockedHttpClient.prototype.delete = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.removeUserFromOrganization("org-1", "user-1");

        expect(result.success).toBe(true);
        expect(MockedHttpClient.prototype.delete).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/users/user-1`
        );
      });
    });

    describe("resendOrganizationInvitationToUser", () => {
      it("should resend an invitation", async () => {
        const mockResponse = { success: true, message: "Invitation resent" };
        MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.resendOrganizationInvitationToUser("org-1", "user-1");

        expect(result.success).toBe(true);
        expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/users/user-1/resend-invitation`
        );
      });
    });
  });

  // ============================================
  // ORGANIZATION API KEY MANAGEMENT
  // ============================================

  describe("Organization API Key Management", () => {
    describe("listOrganizationApiKeys", () => {
      it("should list API keys with default params", async () => {
        const mockResponse = {
          success: true,
          data: {
            results: [{ id: "key-1", name: "Production Key", role: "admin" }],
            totalRecords: 1,
            limit: 50,
            offset: 0,
          },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.listOrganizationApiKeys("org-1");

        expect(result.data.results).toHaveLength(1);
        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/apikeys`,
          undefined
        );
      });

      it("should list API keys with search", async () => {
        const mockResponse = {
          success: true,
          data: { results: [], totalRecords: 0, limit: 50, offset: 0 },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        await TurboPartner.listOrganizationApiKeys("org-1", { search: "prod" });

        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/apikeys`,
          { search: "prod" }
        );
      });
    });

    describe("createOrganizationApiKey", () => {
      it("should create an API key", async () => {
        const mockResponse = {
          success: true,
          data: { id: "key-1", name: "New Key", key: "TDX-full-key-value", role: "admin" },
          message: "API key created",
        };
        MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.createOrganizationApiKey("org-1", {
          name: "New Key",
          role: "admin",
        });

        expect(result.data.key).toBe("TDX-full-key-value");
        expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/apikeys`,
          { name: "New Key", role: "admin" }
        );
      });
    });

    describe("updateOrganizationApiKey", () => {
      it("should update an API key", async () => {
        const mockResponse = {
          success: true,
          message: "API key updated successfully",
          apiKey: { id: "key-1", name: "Updated Key", role: "admin", updatedOn: "2025-06-01T00:00:00Z" },
        };
        MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.updateOrganizationApiKey("org-1", "key-1", {
          name: "Updated Key",
        });

        expect(result.apiKey.name).toBe("Updated Key");
        expect(result.message).toBe("API key updated successfully");
        expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/apikeys/key-1`,
          { name: "Updated Key" }
        );
      });
    });

    describe("revokeOrganizationApiKey", () => {
      it("should revoke an API key", async () => {
        const mockResponse = { success: true, message: "API key revoked" };
        MockedHttpClient.prototype.delete = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.revokeOrganizationApiKey("org-1", "key-1");

        expect(result.success).toBe(true);
        expect(MockedHttpClient.prototype.delete).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/organizations/org-1/apikeys/key-1`
        );
      });
    });
  });

  // ============================================
  // PARTNER API KEY MANAGEMENT
  // ============================================

  describe("Partner API Key Management", () => {
    describe("listPartnerApiKeys", () => {
      it("should list partner API keys", async () => {
        const mockResponse = {
          success: true,
          data: {
            results: [
              { id: "pkey-1", name: "Partner Key", scopes: ["org:create", "org:read"] },
            ],
            totalRecords: 1,
            limit: 50,
            offset: 0,
          },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.listPartnerApiKeys();

        expect(result.data.results).toHaveLength(1);
        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/api-keys`,
          undefined
        );
      });

      it("should list partner API keys with pagination", async () => {
        const mockResponse = {
          success: true,
          data: { results: [], totalRecords: 0, limit: 10, offset: 5 },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        await TurboPartner.listPartnerApiKeys({ limit: 10, offset: 5 });

        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/api-keys`,
          { limit: "10", offset: "5" }
        );
      });
    });

    describe("createPartnerApiKey", () => {
      it("should create a partner API key with scopes", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: "pkey-1",
            name: "CI Key",
            key: "TDXP-full-key-value",
            scopes: ["org:create", "org:read"],
            description: "For CI/CD",
          },
          message: "Partner API key created",
        };
        MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.createPartnerApiKey({
          name: "CI Key",
          scopes: ["org:create", "org:read"],
          description: "For CI/CD",
        });

        expect(result.data.key).toBe("TDXP-full-key-value");
        expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/api-keys`,
          { name: "CI Key", scopes: ["org:create", "org:read"], description: "For CI/CD" }
        );
      });
    });

    describe("updatePartnerApiKey", () => {
      it("should update a partner API key", async () => {
        const mockResponse = {
          success: true,
          message: "Partner API key updated successfully",
          apiKey: { id: "pkey-1", name: "Updated Name", description: "Desc", scopes: ["org:create"], updatedOn: "2025-06-01T00:00:00Z" },
        };
        MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.updatePartnerApiKey("pkey-1", {
          name: "Updated Name",
          scopes: ["org:create"],
        });

        expect(result.apiKey.name).toBe("Updated Name");
        expect(result.message).toBe("Partner API key updated successfully");
        expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/api-keys/pkey-1`,
          { name: "Updated Name", scopes: ["org:create"] }
        );
      });
    });

    describe("revokePartnerApiKey", () => {
      it("should revoke a partner API key", async () => {
        const mockResponse = { success: true, message: "Partner API key revoked" };
        MockedHttpClient.prototype.delete = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.revokePartnerApiKey("pkey-1");

        expect(result.success).toBe(true);
        expect(MockedHttpClient.prototype.delete).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/api-keys/pkey-1`
        );
      });
    });
  });

  // ============================================
  // PARTNER USER MANAGEMENT
  // ============================================

  describe("Partner User Management", () => {
    const mockPermissions: PartnerPermissions = {
      canManageOrgs: true,
      canManageOrgUsers: true,
      canManagePartnerUsers: false,
      canManageOrgAPIKeys: true,
      canManagePartnerAPIKeys: false,
      canUpdateEntitlements: true,
      canViewAuditLogs: true,
    };

    describe("listPartnerPortalUsers", () => {
      it("should list partner users", async () => {
        const mockResponse = {
          success: true,
          data: {
            results: [
              { id: "puser-1", email: "admin@partner.com", role: "admin" },
            ],
            totalRecords: 1,
            limit: 50,
            offset: 0,
          },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.listPartnerPortalUsers();

        expect(result.data.results).toHaveLength(1);
        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/users`,
          undefined
        );
      });

      it("should list partner users with search", async () => {
        const mockResponse = {
          success: true,
          data: { results: [], totalRecords: 0, limit: 50, offset: 0 },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        await TurboPartner.listPartnerPortalUsers({ search: "admin" });

        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/users`,
          { search: "admin" }
        );
      });
    });

    describe("addUserToPartnerPortal", () => {
      it("should add a user with permissions", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: "puser-1",
            email: "admin@partner.com",
            role: "admin",
            permissions: mockPermissions,
          },
        };
        MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.addUserToPartnerPortal({
          email: "admin@partner.com",
          role: "admin",
          permissions: mockPermissions,
        });

        expect(result.data.email).toBe("admin@partner.com");
        expect(result.data.permissions?.canManageOrgs).toBe(true);
        expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/users`,
          { email: "admin@partner.com", role: "admin", permissions: mockPermissions }
        );
      });
    });

    describe("updatePartnerUserPermissions", () => {
      it("should update partner user role and permissions", async () => {
        const mockResponse = {
          success: true,
          data: {
            userId: "puser-1",
            role: "member",
            permissions: { ...mockPermissions, canManageOrgs: false },
          },
        };
        MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.updatePartnerUserPermissions("puser-1", {
          role: "member",
          permissions: { canManageOrgs: false },
        });

        expect(result.data.userId).toBe("puser-1");
        expect(result.data.role).toBe("member");
        expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/users/puser-1`,
          { role: "member", permissions: { canManageOrgs: false } }
        );
      });
    });

    describe("removeUserFromPartnerPortal", () => {
      it("should remove a partner user", async () => {
        const mockResponse = { success: true, message: "User removed" };
        MockedHttpClient.prototype.delete = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.removeUserFromPartnerPortal("puser-1");

        expect(result.success).toBe(true);
        expect(MockedHttpClient.prototype.delete).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/users/puser-1`
        );
      });
    });

    describe("resendPartnerPortalInvitationToUser", () => {
      it("should resend a partner portal invitation", async () => {
        const mockResponse = { success: true, message: "Invitation resent" };
        MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.resendPartnerPortalInvitationToUser("puser-1");

        expect(result.success).toBe(true);
        expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/users/puser-1/resend-invitation`
        );
      });
    });
  });

  // ============================================
  // AUDIT LOGS
  // ============================================

  describe("Audit Logs", () => {
    describe("getPartnerAuditLogs", () => {
      it("should get audit logs with default params", async () => {
        const mockResponse = {
          success: true,
          data: {
            results: [
              {
                id: "log-1",
                partnerId: PARTNER_ID,
                action: "org.created",
                resourceType: "organization",
                resourceId: "org-1",
                success: true,
                createdOn: "2025-06-01T10:00:00Z",
              },
            ],
            totalRecords: 1,
            limit: 50,
            offset: 0,
          },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        const result = await TurboPartner.getPartnerAuditLogs();

        expect(result.data.results).toHaveLength(1);
        expect(result.data.results[0].action).toBe("org.created");
        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/audit-logs`,
          undefined
        );
      });

      it("should get audit logs with filters", async () => {
        const mockResponse = {
          success: true,
          data: { results: [], totalRecords: 0, limit: 10, offset: 0 },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        await TurboPartner.getPartnerAuditLogs({
          limit: 10,
          action: "org.created",
          resourceType: "organization",
          success: true,
          startDate: "2025-01-01",
          endDate: "2025-12-31",
        });

        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/audit-logs`,
          {
            limit: "10",
            action: "org.created",
            resourceType: "organization",
            success: "true",
            startDate: "2025-01-01",
            endDate: "2025-12-31",
          }
        );
      });

      it("should serialize boolean success=false as string", async () => {
        const mockResponse = {
          success: true,
          data: { results: [], totalRecords: 0, limit: 50, offset: 0 },
        };
        MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
        setup();

        await TurboPartner.getPartnerAuditLogs({ success: false });

        expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
          `/partner/${PARTNER_ID}/audit-logs`,
          { success: "false" }
        );
      });
    });
  });

  // ============================================
  // QUERY PARAMETER HANDLING
  // ============================================

  describe("Query Parameter Handling", () => {
    it("should filter out undefined values from query params", async () => {
      const mockResponse = {
        success: true,
        data: { results: [], totalRecords: 0, limit: 50, offset: 0 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      await TurboPartner.listOrganizations({ limit: 10, offset: undefined, search: undefined });

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/organizations`,
        { limit: "10" }
      );
    });

    it("should pass undefined when no query params are provided", async () => {
      const mockResponse = {
        success: true,
        data: { results: [], totalRecords: 0, limit: 50, offset: 0 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      await TurboPartner.listOrganizations();

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/organizations`,
        undefined
      );
    });

    it("should convert numeric values to strings", async () => {
      const mockResponse = {
        success: true,
        data: { results: [], totalRecords: 0, limit: 25, offset: 50 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      await TurboPartner.listOrganizationUsers("org-1", { limit: 25, offset: 50 });

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/organizations/org-1/users`,
        { limit: "25", offset: "50" }
      );
    });
  });

  // ============================================
  // RESPONSE PARSING
  // ============================================

  describe("Response Parsing", () => {
    it("should parse organization response with all optional fields", async () => {
      const mockResponse = {
        success: true,
        data: {
          id: "org-1",
          name: "Full Org",
          partnerId: PARTNER_ID,
          createdOn: "2025-01-01T00:00:00Z",
          updatedOn: "2025-06-01T00:00:00Z",
          createdBy: "admin-user",
          isActive: true,
          userCount: 42,
          storageUsed: 1073741824,
          metadata: { plan: "enterprise" },
        },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.getOrganizationDetails("org-1");

      expect(result.data.partnerId).toBe(PARTNER_ID);
      expect(result.data.isActive).toBe(true);
      expect(result.data.userCount).toBe(42);
      expect(result.data.metadata?.plan).toBe("enterprise");
    });

    it("should parse organization user response with optional fields", async () => {
      const mockResponse = {
        success: true,
        data: {
          id: "user-1",
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          ssoId: "sso-123",
          role: "admin",
          createdOn: "2025-01-01T00:00:00Z",
          isActive: true,
        },
      };
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.addUserToOrganization("org-1", {
        email: "user@example.com",
        role: "admin",
      });

      expect(result.data.firstName).toBe("John");
      expect(result.data.lastName).toBe("Doe");
      expect(result.data.ssoId).toBe("sso-123");
    });

    it("should parse audit log entries with all fields", async () => {
      const mockResponse = {
        success: true,
        data: {
          results: [
            {
              id: "log-1",
              partnerId: PARTNER_ID,
              partnerAPIKeyId: "pkey-1",
              action: "org.created",
              resourceType: "organization",
              resourceId: "org-1",
              details: { orgName: "Acme Corp" },
              success: true,
              ipAddress: "192.168.1.1",
              userAgent: "SDK/1.0",
              createdOn: "2025-06-01T10:00:00Z",
            },
          ],
          totalRecords: 1,
          limit: 50,
          offset: 0,
        },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.getPartnerAuditLogs();

      const entry = result.data.results[0];
      expect(entry.partnerAPIKeyId).toBe("pkey-1");
      expect(entry.details?.orgName).toBe("Acme Corp");
      expect(entry.ipAddress).toBe("192.168.1.1");
      expect(entry.userAgent).toBe("SDK/1.0");
    });

    it("should parse features with all 26 fields", async () => {
      const allFeatures: Features = {
        orgId: "org-1",
        maxUsers: 100,
        maxProjectspaces: 50,
        maxTemplates: 200,
        maxStorage: 10737418240,
        maxGeneratedDeliverables: 1000,
        maxSignatures: 500,
        maxAICredits: 10000,
        rdWatermark: false,
        hasFileDownload: true,
        hasAdvancedDateFormats: true,
        hasGDrive: true,
        hasSharepoint: true,
        hasSharepointOnly: false,
        hasTDAI: true,
        hasPptx: true,
        hasTDWriter: true,
        hasSalesforce: false,
        hasWrike: false,
        hasVariableStack: true,
        hasSubvariables: true,
        hasZapier: true,
        hasBYOM: false,
        hasBYOVS: false,
        hasBetaFeatures: false,
        enableBulkSending: true,
        createdBy: "admin",
      };

      const mockResponse = {
        success: true,
        data: {
          features: allFeatures,
          tracking: {
            numUsers: 42,
            numProjectspaces: 10,
            numTemplates: 50,
            storageUsed: 1073741824,
            numGeneratedDeliverables: 100,
            numSignaturesUsed: 25,
            currentAICredits: 9500,
          },
        },
      };
      MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.updateOrganizationEntitlements("org-1", {
        features: allFeatures,
      });

      expect(result.data.features?.maxUsers).toBe(100);
      expect(result.data.features?.hasTDAI).toBe(true);
      expect(result.data.features?.enableBulkSending).toBe(true);
      expect(result.data.tracking?.numUsers).toBe(42);
      expect(result.data.tracking?.currentAICredits).toBe(9500);
    });

    it("should handle minimal response with only required fields", async () => {
      const mockResponse = {
        success: true,
        data: { id: "org-1", name: "Minimal Org" },
      };
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.createOrganization({ name: "Minimal Org" });

      expect(result.data.id).toBe("org-1");
      expect(result.data.partnerId).toBeUndefined();
      expect(result.data.metadata).toBeUndefined();
    });

    it("should handle OrgUserListResponse with userLimit", async () => {
      const mockResponse = {
        success: true,
        data: {
          results: [{ id: "user-1", email: "user@example.com" }],
          totalRecords: 1,
          limit: 50,
          offset: 0,
        },
        userLimit: { max: 25, current: 2 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.listOrganizationUsers("org-1");

      expect(result.userLimit).toEqual({ max: 25, current: 2 });
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe("Error Handling", () => {
    it("should propagate API errors from GET", async () => {
      const apiError = new Error("Not Found");
      MockedHttpClient.prototype.get = jest.fn().mockRejectedValue(apiError);
      setup();

      await expect(
        TurboPartner.getOrganizationDetails("nonexistent")
      ).rejects.toThrow("Not Found");
    });

    it("should propagate validation errors from POST", async () => {
      const validationError = { statusCode: 400, message: "Name is required" };
      MockedHttpClient.prototype.post = jest.fn().mockRejectedValue(validationError);
      setup();

      await expect(
        TurboPartner.createOrganization({ name: "" })
      ).rejects.toEqual(validationError);
    });

    it("should propagate authentication errors", async () => {
      const authError = { statusCode: 401, message: "Invalid API key" };
      MockedHttpClient.prototype.get = jest.fn().mockRejectedValue(authError);
      setup();

      await expect(
        TurboPartner.listOrganizations()
      ).rejects.toEqual(authError);
    });

    it("should propagate errors from PATCH", async () => {
      const error = { statusCode: 403, message: "Forbidden" };
      MockedHttpClient.prototype.patch = jest.fn().mockRejectedValue(error);
      setup();

      await expect(
        TurboPartner.updateOrganizationInfo("org-1", { name: "New Name" })
      ).rejects.toEqual(error);
    });

    it("should propagate errors from DELETE", async () => {
      const error = { statusCode: 404, message: "Organization not found" };
      MockedHttpClient.prototype.delete = jest.fn().mockRejectedValue(error);
      setup();

      await expect(
        TurboPartner.deleteOrganization("nonexistent")
      ).rejects.toEqual(error);
    });
  });
});
