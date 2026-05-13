/**
 * TurboPartner Webhook Management Tests
 *
 * Tests for webhook provisioning operations:
 * - createWebhook
 * - listWebhooks
 * - getWebhook
 * - updateWebhook
 * - deleteWebhook
 * - testWebhook
 * - listWebhookDeliveries
 */

import { TurboPartner } from "../src/modules/partner";
import { HttpClient } from "../src/http";

// Mock the HttpClient
jest.mock("../src/http");

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

const PARTNER_ID = "partner-uuid-123";
const PARTNER_API_KEY = "TDXP-test-key-123";
const ORG_ID = "org-uuid-456";
const WEBHOOK_NAME = "my-signing-webhook";

/** Reset static state and reconfigure TurboPartner */
function setup() {
  (TurboPartner as any).client = undefined;
  (TurboPartner as any).partnerId = undefined;
  TurboPartner.configure({
    partnerApiKey: PARTNER_API_KEY,
    partnerId: PARTNER_ID,
  });
}

const mockWebhook = {
  id: "webhook-uuid-789",
  name: WEBHOOK_NAME,
  urls: ["https://example.com/hook"],
  events: ["signature.document.completed"],
  isActive: true,
  createdOn: "2025-01-01T00:00:00.000Z",
  updatedOn: "2025-01-01T00:00:00.000Z",
};

describe("TurboPartner Webhook Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TurboPartner as any).client = undefined;
    (TurboPartner as any).partnerId = undefined;
  });

  // ============================================
  // createWebhook
  // ============================================

  describe("createWebhook", () => {
    it("should create a webhook and return the result with secret", async () => {
      const mockResponse = {
        success: true,
        data: { ...mockWebhook, secret: "whsec_abc123" },
      };
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.createWebhook(ORG_ID, {
        name: WEBHOOK_NAME,
        urls: ["https://example.com/hook"],
        events: ["signature.document.completed"],
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(WEBHOOK_NAME);
      expect(result.data.secret).toBe("whsec_abc123");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks`,
        {
          name: WEBHOOK_NAME,
          urls: ["https://example.com/hook"],
          events: ["signature.document.completed"],
        }
      );
    });

    it("should throw AuthenticationError on 401", async () => {
      const authError = new Error("Unauthorized");
      (authError as any).statusCode = 401;
      MockedHttpClient.prototype.post = jest.fn().mockRejectedValue(authError);
      setup();

      await expect(
        TurboPartner.createWebhook(ORG_ID, {
          name: WEBHOOK_NAME,
          urls: ["https://example.com/hook"],
          events: ["signature.document.completed"],
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it("should throw ValidationError on 400", async () => {
      const validationError = new Error("Validation failed");
      (validationError as any).statusCode = 400;
      MockedHttpClient.prototype.post = jest.fn().mockRejectedValue(validationError);
      setup();

      await expect(
        TurboPartner.createWebhook(ORG_ID, {
          name: "",
          urls: [],
          events: [],
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ============================================
  // listWebhooks
  // ============================================

  describe("listWebhooks", () => {
    it("should list webhooks without params", async () => {
      const mockResponse = {
        success: true,
        data: { results: [mockWebhook], totalRecords: 1, limit: 50, offset: 0 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.listWebhooks(ORG_ID);

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.totalRecords).toBe(1);
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks`,
        undefined
      );
    });

    it("should pass pagination params as query string", async () => {
      const mockResponse = {
        success: true,
        data: { results: [], totalRecords: 0, limit: 10, offset: 20 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      await TurboPartner.listWebhooks(ORG_ID, { limit: 10, offset: 20 });

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks`,
        { limit: "10", offset: "20" }
      );
    });

    it("should serialize boolean isActive as string", async () => {
      const mockResponse = {
        success: true,
        data: { results: [], totalRecords: 0, limit: 50, offset: 0 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      await TurboPartner.listWebhooks(ORG_ID, { isActive: true });

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks`,
        { isActive: "true" }
      );
    });
  });

  // ============================================
  // getWebhook
  // ============================================

  describe("getWebhook", () => {
    it("should get a webhook by name", async () => {
      const mockResponse = { success: true, data: mockWebhook };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.getWebhook(ORG_ID, WEBHOOK_NAME);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(WEBHOOK_NAME);
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks/${WEBHOOK_NAME}`
      );
    });

    it("should throw NotFoundError on 404", async () => {
      const notFoundError = new Error("Not found");
      (notFoundError as any).statusCode = 404;
      MockedHttpClient.prototype.get = jest.fn().mockRejectedValue(notFoundError);
      setup();

      await expect(
        TurboPartner.getWebhook(ORG_ID, "nonexistent")
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ============================================
  // updateWebhook
  // ============================================

  describe("updateWebhook", () => {
    it("should update a webhook with partial fields", async () => {
      const mockResponse = {
        success: true,
        data: { ...mockWebhook, isActive: false },
      };
      MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.updateWebhook(ORG_ID, WEBHOOK_NAME, {
        isActive: false,
      });

      expect(result.success).toBe(true);
      expect(result.data.isActive).toBe(false);
      expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks/${WEBHOOK_NAME}`,
        { isActive: false }
      );
    });

    it("should update urls and events", async () => {
      const updated = {
        ...mockWebhook,
        urls: ["https://new.example.com/hook"],
        events: ["signature.document.voided"],
      };
      const mockResponse = { success: true, data: updated };
      MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.updateWebhook(ORG_ID, WEBHOOK_NAME, {
        urls: ["https://new.example.com/hook"],
        events: ["signature.document.voided"],
      });

      expect(result.data.urls).toContain("https://new.example.com/hook");
      expect(result.data.events).toContain("signature.document.voided");
    });
  });

  // ============================================
  // deleteWebhook
  // ============================================

  describe("deleteWebhook", () => {
    it("should delete a webhook and return success", async () => {
      const mockResponse = { success: true, message: "Webhook deleted" };
      MockedHttpClient.prototype.delete = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.deleteWebhook(ORG_ID, WEBHOOK_NAME);

      expect(result.success).toBe(true);
      expect(MockedHttpClient.prototype.delete).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks/${WEBHOOK_NAME}`
      );
    });
  });

  // ============================================
  // testWebhook
  // ============================================

  describe("testWebhook", () => {
    it("should send a test event and return the delivery summary", async () => {
      const mockResponse = {
        success: true,
        data: {
          deliveries: [],
          summary: { total: 1, successful: 1, failed: 0, errors: [] },
        },
      };
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.testWebhook(ORG_ID, WEBHOOK_NAME);

      expect(result.success).toBe(true);
      expect(result.data.summary.successful).toBe(1);
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks/${WEBHOOK_NAME}/test`,
        {}
      );
    });

    it("should pass event and data overrides", async () => {
      const mockResponse = {
        success: true,
        data: {
          deliveries: [],
          summary: { total: 1, successful: 1, failed: 0, errors: [] },
        },
      };
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      setup();

      await TurboPartner.testWebhook(ORG_ID, WEBHOOK_NAME, {
        event: "signature.document.voided",
        data: { documentId: "doc-1" },
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks/${WEBHOOK_NAME}/test`,
        { event: "signature.document.voided", data: { documentId: "doc-1" } }
      );
    });
  });

  // ============================================
  // listWebhookDeliveries
  // ============================================

  describe("listWebhookDeliveries", () => {
    it("should list deliveries for a webhook", async () => {
      const mockDelivery = {
        id: "delivery-1",
        webhookId: "webhook-uuid-789",
        event: "signature.document.completed",
        statusCode: 200,
        success: true,
        attemptCount: 1,
        createdOn: "2025-01-01T00:00:00.000Z",
      };
      const mockResponse = {
        success: true,
        data: { results: [mockDelivery], totalRecords: 1, limit: 50, offset: 0 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      const result = await TurboPartner.listWebhookDeliveries(ORG_ID, WEBHOOK_NAME);

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].event).toBe("signature.document.completed");
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks/${WEBHOOK_NAME}/deliveries`,
        undefined
      );
    });

    it("should pass pagination params", async () => {
      const mockResponse = {
        success: true,
        data: { results: [], totalRecords: 0, limit: 10, offset: 5 },
      };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      setup();

      await TurboPartner.listWebhookDeliveries(ORG_ID, WEBHOOK_NAME, {
        limit: 10,
        offset: 5,
      });

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        `/partner/${PARTNER_ID}/orgs/${ORG_ID}/webhooks/${WEBHOOK_NAME}/deliveries`,
        { limit: "10", offset: "5" }
      );
    });
  });
});
