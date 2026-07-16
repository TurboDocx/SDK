/**
 * TurboWebhooks Module Tests
 *
 * Mocks HttpClient directly (matches the pattern in turbosign.test.ts and
 * turbopartner.test.ts). The SDK is locked to a single webhook per org
 * named `signature`, so no `name` parameter exists on any method — every
 * route hits `/api/webhooks/signature[/...]`.
 *
 * Order-sensitive: each test stubs `MockedHttpClient.prototype.<verb>`
 * BEFORE calling `configure()`, because auto-mocked instance methods are
 * bound at construction time and ignore later prototype reassignment.
 */

import { TurboWebhooks } from "../src/modules/webhooks";
import { HttpClient } from "../src/http";
import { WEBHOOK_EVENTS, WebhookEvents } from "../src/types/webhooks";
import { verifyWebhookSignature } from "../src/utils/verifyWebhookSignature";
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../src/utils/errors";
import { createHmac } from "crypto";

jest.mock("../src/http");

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

const API_KEY = "TDX-test-key-abc123";
const ORG_ID = "org-uuid-test";

function configure() {
  TurboWebhooks.configure({ apiKey: API_KEY, orgId: ORG_ID });
}

describe("TurboWebhooks Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TurboWebhooks as any).client = undefined;
    delete process.env.TURBODOCX_API_KEY;
    delete process.env.TURBODOCX_ORG_ID;
  });

  // ============================================
  // CONFIGURATION
  // ============================================

  describe("configure", () => {
    it("should configure HttpClient with skipSenderValidation: true", () => {
      TurboWebhooks.configure({ apiKey: API_KEY, orgId: ORG_ID });

      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: API_KEY,
        accessToken: undefined,
        orgId: ORG_ID,
        baseUrl: undefined,
        skipSenderValidation: true,
      });
    });

    it("should pass through baseUrl when provided", () => {
      TurboWebhooks.configure({
        apiKey: API_KEY,
        orgId: ORG_ID,
        baseUrl: "http://localhost:3000",
      });

      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: API_KEY,
        accessToken: undefined,
        orgId: ORG_ID,
        baseUrl: "http://localhost:3000",
        skipSenderValidation: true,
      });
    });

    it("should not let a caller override skipSenderValidation", () => {
      TurboWebhooks.configure({
        apiKey: API_KEY,
        orgId: ORG_ID,
        skipSenderValidation: false,
      } as any);

      const lastCall = MockedHttpClient.mock.calls[MockedHttpClient.mock.calls.length - 1];
      expect(lastCall[0]).toMatchObject({ skipSenderValidation: true });
    });
  });

  describe("getClient lazy fallback", () => {
    it("should auto-configure from env vars when not configured", async () => {
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue({});
      process.env.TURBODOCX_API_KEY = "TDX-env-key";
      process.env.TURBODOCX_ORG_ID = "env-org-id";

      await TurboWebhooks.getWebhook();

      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "TDX-env-key",
        accessToken: undefined,
        orgId: "env-org-id",
        baseUrl: undefined,
        skipSenderValidation: true,
      });
    });

    it("should throw descriptive error when env vars are missing", async () => {
      await expect(TurboWebhooks.getWebhook()).rejects.toThrow(
        /TurboWebhooks must be configured/,
      );
    });
  });

  // ============================================
  // CRUD — always hits /api/webhooks/signature[/...]
  // ============================================

  describe("createWebhook", () => {
    it("should POST /api/webhooks with name=signature injected and return id + secret", async () => {
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        data: { id: "wh-1", secret: "whsec_abc123" },
        message: "Webhook created successfully.",
      });
      configure();

      const result = await TurboWebhooks.createWebhook({
        urls: ["https://example.com/sink"],
        events: ["signature.document.completed"],
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith("/api/webhooks", {
        name: "signature",
        urls: ["https://example.com/sink"],
        events: ["signature.document.completed"],
      });
      expect(result).toEqual({ id: "wh-1", secret: "whsec_abc123" });
    });
  });

  describe("getWebhook", () => {
    it("should GET /api/webhooks/signature and return WebhookWithStats", async () => {
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue({
        id: "wh-1",
        name: "signature",
        urls: ["https://example.com/sink"],
        events: ["signature.document.completed"],
        isActive: true,
        createdOn: "2026-05-01T00:00:00Z",
        updatedOn: "2026-05-01T00:00:00Z",
        deliveryStats: {
          totalDeliveries: 10,
          successfulDeliveries: 8,
          failedDeliveries: 2,
          pendingRetries: 0,
        },
        availableEvents: ["signature.document.completed", "signature.document.voided"],
      });
      configure();

      const result = await TurboWebhooks.getWebhook();

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith("/api/webhooks/signature");
      expect(result.deliveryStats.totalDeliveries).toBe(10);
      expect(result.availableEvents.length).toBe(2);
    });
  });

  describe("updateWebhook", () => {
    it("should PATCH /api/webhooks/signature and unwrap envelope", async () => {
      MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue({
        data: {
          id: "wh-1",
          name: "signature",
          urls: ["https://example.com/sink"],
          events: ["signature.document.completed"],
          isActive: false,
        },
        message: "Webhook updated successfully",
      });
      configure();

      const result = await TurboWebhooks.updateWebhook({ isActive: false });

      expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
        "/api/webhooks/signature",
        { isActive: false },
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe("deleteWebhook", () => {
    it("should DELETE /api/webhooks/signature", async () => {
      MockedHttpClient.prototype.delete = jest
        .fn()
        .mockResolvedValue({ message: "Webhook deleted successfully" });
      configure();

      const result = await TurboWebhooks.deleteWebhook();

      expect(MockedHttpClient.prototype.delete).toHaveBeenCalledWith("/api/webhooks/signature");
      expect(result.message).toMatch(/deleted/);
    });
  });

  // ============================================
  // TEST / NOTIFY
  // ============================================

  describe("testWebhook", () => {
    it("should POST /api/webhooks/signature/test with eventType + payload and unwrap envelope", async () => {
      // Mock mirrors backend TestWebhookResult.summary shape — including the
      // `errors: string[]` array the SDK type previously omitted.
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        data: {
          deliveries: [],
          summary: { total: 1, successful: 1, failed: 0, errors: [] },
        },
        message: "Test webhook sent successfully to all URLs",
      });
      configure();

      const result = await TurboWebhooks.testWebhook({
        eventType: "signature.document.completed",
        payload: { documentId: "doc-1" },
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/api/webhooks/signature/test",
        {
          eventType: "signature.document.completed",
          payload: { documentId: "doc-1" },
        },
      );
      expect(result.summary.successful).toBe(1);
      // The summary now exposes per-URL failure messages.
      expect(result.summary.errors).toEqual([]);
    });

    it("should surface per-URL error strings in summary.errors on partial failure", async () => {
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        data: {
          deliveries: [],
          summary: {
            total: 2,
            successful: 1,
            failed: 1,
            errors: ["https://broken.example.com: 502 Bad Gateway"],
          },
        },
        message: "Test webhook sent",
      });
      configure();

      const result = await TurboWebhooks.testWebhook({
        eventType: "signature.document.completed",
        payload: {},
      });

      expect(result.summary.errors).toHaveLength(1);
      expect(result.summary.errors[0]).toMatch(/502 Bad Gateway/);
    });
  });

  describe("notifyWebhook", () => {
    it("should POST /api/webhooks/signature/notify and unwrap envelope", async () => {
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        data: {
          deliveries: [],
          summary: { total: 1, successful: 1, failed: 0 },
        },
        message: "Manual notification sent successfully to all URLs",
      });
      configure();

      await TurboWebhooks.notifyWebhook({
        eventType: "signature.document.completed",
        payload: { documentId: "doc-2" },
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/api/webhooks/signature/notify",
        {
          eventType: "signature.document.completed",
          payload: { documentId: "doc-2" },
        },
      );
    });
  });

  // ============================================
  // DELIVERIES + REPLAY
  // ============================================

  describe("listWebhookDeliveries", () => {
    it("should GET /api/webhooks/signature/deliveries with filters", async () => {
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue({ results: [], totalRecords: 0, limit: 10, offset: 0 });
      configure();

      await TurboWebhooks.listWebhookDeliveries({
        limit: 10,
        isDelivered: false,
      });

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/api/webhooks/signature/deliveries",
        { limit: 10, isDelivered: false },
      );
    });
  });

  describe("replayWebhookDelivery", () => {
    it("should POST /api/webhooks/signature/replay with deliveryId and return the full WebhookDelivery", async () => {
      // Mock mirrors the actual backend route: `{ data: WebhookDelivery, message }`.
      // The SDK extracts `data`, so the caller receives the entire delivery row.
      const newDelivery = {
        id: "delivery-2",
        webhookId: "wh-1",
        eventType: "signature.document.completed",
        payload: { documentId: "doc-1" },
        httpStatus: 200,
        isDelivered: true,
        attemptCount: 1,
        deliveredAt: "2026-05-13T12:00:00Z",
        createdOn: "2026-05-13T11:59:59Z",
      };
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        data: newDelivery,
        message: "Webhook delivery replayed successfully - new delivery attempt created",
      });
      configure();

      const result = await TurboWebhooks.replayWebhookDelivery("delivery-1");

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/api/webhooks/signature/replay",
        { deliveryId: "delivery-1" },
      );
      // Returned shape is the full WebhookDelivery, not just an id/httpStatus pair.
      expect(result.id).toBe("delivery-2");
      expect(result.webhookId).toBe("wh-1");
      expect(result.eventType).toBe("signature.document.completed");
      expect(result.attemptCount).toBe(1);
      expect(result.isDelivered).toBe(true);
    });
  });

  // ============================================
  // SECRET ROTATION + STATS
  // ============================================

  describe("regenerateWebhookSecret", () => {
    it("should POST /api/webhooks/signature/regenerate and return data without envelope message field", async () => {
      // Backend envelope is `{ data: { id, secret, regeneratedAt }, message }`
      // — `message` lives at the envelope, not inside `data`. The SDK extracts
      // `data`, so the response shape is { id, secret, regeneratedAt } only.
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        data: {
          id: "wh-1",
          secret: "whsec_newRotated",
          regeneratedAt: "2026-05-13T12:00:00Z",
        },
        message: "Webhook secret regenerated successfully. Save the new secret - it won't be shown again.",
      });
      configure();

      const result = await TurboWebhooks.regenerateWebhookSecret();

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/api/webhooks/signature/regenerate",
      );
      expect(result.secret).toBe("whsec_newRotated");
      expect(result.id).toBe("wh-1");
      expect(result.regeneratedAt).toBe("2026-05-13T12:00:00Z");
      // The envelope message field is intentionally absent from the data shape.
      expect((result as unknown as Record<string, unknown>).message).toBeUndefined();
    });
  });

  describe("getWebhookStats", () => {
    it("should GET /api/webhooks/signature/stats with days query", async () => {
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue({
        webhook: {
          id: "wh-1",
          name: "signature",
          isActive: true,
          events: ["signature.document.completed"],
          urls: ["https://example.com/sink"],
        },
        period: { days: 7, from: "2026-05-06", to: "2026-05-13" },
        summary: {
          totalDeliveries: 100,
          successfulDeliveries: 95,
          failedDeliveries: 5,
          pendingRetries: 0,
          avgResponseTime: 234,
          successRate: 95,
          lastSuccessfulDelivery: "2026-05-13T11:00:00Z",
          lastFailedDelivery: "2026-05-12T08:00:00Z",
        },
        eventBreakdown: [
          {
            eventType: "signature.document.completed",
            total: 100,
            successful: 95,
            failed: 5,
            successRate: 95,
          },
        ],
      });
      configure();

      const result = await TurboWebhooks.getWebhookStats({ days: 7 });

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/api/webhooks/signature/stats",
        { days: 7 },
      );
      expect(result.summary.successRate).toBe(95);
      expect(result.period.from).toBe("2026-05-06");
    });
  });

  // ============================================
  // ERROR PROPAGATION
  // ============================================

  describe("error propagation", () => {
    it("should propagate AuthenticationError on 401", async () => {
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockRejectedValue(new AuthenticationError("Invalid API key"));
      configure();

      await expect(TurboWebhooks.getWebhook()).rejects.toBeInstanceOf(AuthenticationError);
    });

    it("should propagate AuthorizationError on 403", async () => {
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockRejectedValue(new AuthorizationError("Forbidden"));
      configure();

      await expect(TurboWebhooks.getWebhook()).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("should propagate NotFoundError on 404", async () => {
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockRejectedValue(new NotFoundError("Webhook not found"));
      configure();

      await expect(TurboWebhooks.getWebhook()).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should propagate ValidationError on 400", async () => {
      MockedHttpClient.prototype.post = jest
        .fn()
        .mockRejectedValue(new ValidationError("All webhook URLs must use HTTPS"));
      configure();

      await expect(
        TurboWebhooks.createWebhook({
          urls: ["http://insecure.example.com"],
          events: ["signature.document.completed"],
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("should propagate ConflictError on 409 from createWebhook", async () => {
      MockedHttpClient.prototype.post = jest
        .fn()
        .mockRejectedValue(
          new ConflictError("Webhook with name signature already exists"),
        );
      configure();

      await expect(
        TurboWebhooks.createWebhook({
          urls: ["https://example.com/hook"],
          events: ["signature.document.completed"],
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("should propagate ConflictError on 409 from updateWebhook", async () => {
      MockedHttpClient.prototype.patch = jest
        .fn()
        .mockRejectedValue(
          new ConflictError("Webhook name conflict"),
        );
      configure();

      await expect(
        TurboWebhooks.updateWebhook({
          urls: ["https://example.com/hook"],
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });
});

// ============================================
// HMAC HELPER (pure function, no HTTP)
// ============================================

describe("verifyWebhookSignature", () => {
  const SECRET = "whsec_test_secret_xyz";
  const BODY = JSON.stringify({ event: "signature.document.completed", documentId: "doc-1" });
  const NOW_SECONDS = 1747000000;
  const TIMESTAMP = NOW_SECONDS.toString();

  function sign(body: string, timestamp: string, secret: string): string {
    return (
      "sha256=" +
      createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex")
    );
  }

  const validSig = sign(BODY, TIMESTAMP, SECRET);

  it("should accept a valid signature within the timestamp window", () => {
    expect(
      verifyWebhookSignature(BODY, validSig, TIMESTAMP, SECRET, { now: () => NOW_SECONDS }),
    ).toBe(true);
  });

  it("should reject a tampered body", () => {
    expect(
      verifyWebhookSignature(BODY + "tampered", validSig, TIMESTAMP, SECRET, {
        now: () => NOW_SECONDS,
      }),
    ).toBe(false);
  });

  it("should reject a tampered timestamp (signature no longer matches)", () => {
    expect(
      verifyWebhookSignature(BODY, validSig, (NOW_SECONDS + 1).toString(), SECRET, {
        now: () => NOW_SECONDS + 1,
      }),
    ).toBe(false);
  });

  it("should reject a stale timestamp (older than tolerance)", () => {
    expect(
      verifyWebhookSignature(BODY, validSig, TIMESTAMP, SECRET, {
        now: () => NOW_SECONDS + 301,
      }),
    ).toBe(false);
  });

  it("should reject a future timestamp (further than tolerance)", () => {
    expect(
      verifyWebhookSignature(BODY, validSig, TIMESTAMP, SECRET, {
        now: () => NOW_SECONDS - 301,
      }),
    ).toBe(false);
  });

  it("should ignore the timestamp window when toleranceSeconds is 0", () => {
    expect(
      verifyWebhookSignature(BODY, validSig, TIMESTAMP, SECRET, {
        toleranceSeconds: 0,
        now: () => NOW_SECONDS + 99999,
      }),
    ).toBe(true);
  });

  it("should reject when signature header is missing", () => {
    expect(verifyWebhookSignature(BODY, "", TIMESTAMP, SECRET)).toBe(false);
  });

  it("should reject when timestamp header is missing", () => {
    expect(verifyWebhookSignature(BODY, validSig, "", SECRET)).toBe(false);
  });

  it("should reject when secret is missing", () => {
    expect(verifyWebhookSignature(BODY, validSig, TIMESTAMP, "")).toBe(false);
  });

  it("should reject a non-numeric timestamp", () => {
    expect(
      verifyWebhookSignature(BODY, validSig, "not-a-number", SECRET, { now: () => NOW_SECONDS }),
    ).toBe(false);
  });

  it("should reject a length-mismatched signature without crashing", () => {
    expect(
      verifyWebhookSignature(BODY, "sha256=short", TIMESTAMP, SECRET, { now: () => NOW_SECONDS }),
    ).toBe(false);
  });

  it("should accept a Buffer body", () => {
    expect(
      verifyWebhookSignature(Buffer.from(BODY, "utf8"), validSig, TIMESTAMP, SECRET, {
        now: () => NOW_SECONDS,
      }),
    ).toBe(true);
  });
});

// ============================================
// WEBHOOK EVENT CONSTANTS
// ============================================

describe("WEBHOOK_EVENTS", () => {
  // Drift guard: if the backend adds an event, this list must grow with it.
  const EXPECTED = [
    "signature.document.sent",
    "signature.document.viewed",
    "signature.document.recipient_signed",
    "signature.document.signed",
    "signature.document.completed",
    "signature.document.finalization_failed",
    "signature.document.voided",
  ];

  it("should contain exactly the 7 known wire strings, in lifecycle order", () => {
    expect([...WEBHOOK_EVENTS]).toEqual(EXPECTED);
  });

  it("should expose the same 7 values on the WebhookEvents map", () => {
    expect(Object.values(WebhookEvents).sort()).toEqual([...EXPECTED].sort());
  });

  it("should map each named member to its wire string", () => {
    expect(WebhookEvents.SENT).toBe("signature.document.sent");
    expect(WebhookEvents.VIEWED).toBe("signature.document.viewed");
    expect(WebhookEvents.RECIPIENT_SIGNED).toBe("signature.document.recipient_signed");
    expect(WebhookEvents.SIGNED).toBe("signature.document.signed");
    expect(WebhookEvents.COMPLETED).toBe("signature.document.completed");
    expect(WebhookEvents.FINALIZATION_FAILED).toBe("signature.document.finalization_failed");
    expect(WebhookEvents.VOIDED).toBe("signature.document.voided");
  });

  it("should still accept a raw event string on createWebhook (non-breaking)", async () => {
    const post = jest.fn().mockResolvedValue({ data: { id: "wh_1", secret: "s" } });
    MockedHttpClient.prototype.post = post;
    TurboWebhooks.configure({ apiKey: API_KEY, orgId: ORG_ID });

    await TurboWebhooks.createWebhook({
      urls: ["https://example.com/hook"],
      // A raw string the SDK has never heard of — still compiles, still sent.
      events: ["signature.document.some_future_event"],
    });

    expect(post).toHaveBeenCalledWith("/api/webhooks", {
      name: "signature",
      urls: ["https://example.com/hook"],
      events: ["signature.document.some_future_event"],
    });
  });
});
