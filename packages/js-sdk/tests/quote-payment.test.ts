/**
 * TurboQuote Payments — SDK method tests.
 *
 * Verifies each payments method calls the correct path/verb and unwraps the backend's
 * `{ data: { results } }` envelope (the HttpClient strips `data`; methods read `results`).
 * The HTTP layer is mocked — no real calls.
 */
import { TurboQuote } from "../src/modules/quote";
import { HttpClient } from "../src/http";

jest.mock("../src/http", () => {
  const actual = jest.requireActual("../src/http");
  return { ...actual, HttpClient: jest.fn() };
});

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe("TurboQuote Payments", () => {
  let mockClient: { get: jest.Mock; post: jest.Mock; patch: jest.Mock; delete: jest.Mock; getRaw: jest.Mock };

  beforeEach(() => {
    mockClient = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), getRaw: jest.fn() };
    MockedHttpClient.mockImplementation(() => mockClient as unknown as HttpClient);
    TurboQuote.configure({ apiKey: "tdx_test", orgId: "org-1" });
  });

  describe("createPaymentLink", () => {
    it("POSTs to the quote checkout endpoint with the buyer email and returns the link", async () => {
      mockClient.post.mockResolvedValue({ results: { checkoutUrl: "https://checkout/x", paymentId: "pay-1" } });

      const result = await TurboQuote.createPaymentLink("q-1", { buyerEmail: "buyer@example.com" });

      expect(mockClient.post).toHaveBeenCalledWith("/v1/quotes/q-1/payment/checkout", { buyerEmail: "buyer@example.com" });
      expect(result).toEqual({ checkoutUrl: "https://checkout/x", paymentId: "pay-1" });
    });

    it("POSTs an empty body when no buyer email is given", async () => {
      mockClient.post.mockResolvedValue({ results: { checkoutUrl: "u", paymentId: "p" } });

      await TurboQuote.createPaymentLink("q-2");

      expect(mockClient.post).toHaveBeenCalledWith("/v1/quotes/q-2/payment/checkout", {});
    });
  });

  describe("getPaymentStatus", () => {
    it("GETs the quote payment status and returns the unwrapped result", async () => {
      mockClient.get.mockResolvedValue({
        results: { status: "paid", paymentId: "pay-1", amountDueToday: 341.5, currency: "USD", providerName: "stripe_connect", checkoutId: "cs_1", updatedOn: "2026-06-12T12:00:00Z" },
      });

      const result = await TurboQuote.getPaymentStatus("q-1");

      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/q-1/payment");
      expect(result.status).toBe("paid");
      expect(result.amountDueToday).toBe(341.5);
    });

    it("surfaces a 'none' status for an unpaid quote", async () => {
      mockClient.get.mockResolvedValue({ results: { status: "none", paymentId: null } });
      const result = await TurboQuote.getPaymentStatus("q-9");
      expect(result.status).toBe("none");
      expect(result.paymentId).toBeNull();
    });
  });

  describe("getPaymentConnectionStatus", () => {
    it("GETs the connection status with provider capabilities", async () => {
      mockClient.get.mockResolvedValue({
        results: {
          connected: true,
          chargesEnabled: true,
          payoutsEnabled: true,
          requirementsDue: [],
          capabilities: { supportsReferenceMetadata: true, supportsWebhookEvents: true, supportsSubscriptions: true, supportsCustomerPortal: true },
        },
      });

      const result = await TurboQuote.getPaymentConnectionStatus();

      expect(mockClient.get).toHaveBeenCalledWith("/v1/quote-payments/status");
      expect(result.chargesEnabled).toBe(true);
      expect(result.capabilities.supportsSubscriptions).toBe(true);
    });
  });
});
