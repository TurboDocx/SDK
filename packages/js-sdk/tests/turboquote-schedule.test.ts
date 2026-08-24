/**
 * TurboQuote reminder + expiration schedule serialization tests.
 *
 * The quote send endpoints are JSON (unlike the signature send, which is multipart), so the eight
 * schedule fields ride FLAT at the top level of the request body — NOT nested under a "schedule"
 * key — and durations serialize as plain `{ value, unit }` OBJECTS, not JSON-encoded strings.
 * Presence is null-checked, so a deliberate `false` / `0` survives while an unset field is omitted
 * and inherits the org default. Request-body keys stay camelCase.
 *
 * This mirrors how the signature-schedule suite inspects the mocked HTTP request body — here the
 * body is the second argument the SDK hands to `HttpClient.post`.
 */

import { TurboQuote } from "../src/modules/quote";
import { HttpClient } from "../src/http";

jest.mock("../src/http", () => {
  const actual = jest.requireActual("../src/http");
  return {
    ...actual,
    HttpClient: jest.fn(),
  };
});

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

const SCHEDULE_KEYS = [
  "remindersEnabled",
  "reminderDelay",
  "reminderInterval",
  "maxReminders",
  "expirationEnabled",
  "expireAfter",
  "expirationWarning",
  "expirationWarningInterval",
] as const;

describe("TurboQuote schedule serialization", () => {
  let mockClient: { post: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    (TurboQuote as any).client = undefined;
    mockClient = { post: jest.fn() };
    MockedHttpClient.mockImplementation(() => mockClient as any);
    TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
  });

  describe("sendQuote — JSON send path", () => {
    it("sends every schedule field FLAT at the top level with object durations", async () => {
      mockClient.post.mockResolvedValue({ result: { id: "q-1", status: "sent" }, message: "Quote sent" });

      await TurboQuote.sendQuote("q-1", {
        ccEmails: ["admin@example.com"],
        remindersEnabled: true,
        reminderDelay: { value: 3, unit: "days" },
        reminderInterval: { value: 12, unit: "hours" },
        maxReminders: 5,
        expirationEnabled: true,
        expireAfter: { value: 30, unit: "days" },
        expirationWarning: { value: 3, unit: "days" },
        expirationWarningInterval: { value: 1, unit: "days" },
      });

      const body = mockClient.post.mock.calls[0][1];

      // Flat at the top level, never nested under "schedule".
      expect(body).not.toHaveProperty("schedule");

      // Native booleans / number — not stringified.
      expect(body.remindersEnabled).toBe(true);
      expect(body.expirationEnabled).toBe(true);
      expect(body.maxReminders).toBe(5);

      // Durations are OBJECTS, not JSON strings (this is a JSON endpoint).
      expect(body.reminderDelay).toEqual({ value: 3, unit: "days" });
      expect(typeof body.reminderDelay).toBe("object");
      expect(body.reminderInterval).toEqual({ value: 12, unit: "hours" });
      expect(body.expireAfter).toEqual({ value: 30, unit: "days" });
      expect(body.expirationWarning).toEqual({ value: 3, unit: "days" });
      expect(body.expirationWarningInterval).toEqual({ value: 1, unit: "days" });

      // Unrelated send options ride alongside.
      expect(body.ccEmails).toEqual(["admin@example.com"]);
    });

    it("omits every schedule key when the caller sets none, so the org defaults apply", async () => {
      mockClient.post.mockResolvedValue({ result: { id: "q-1", status: "sent" }, message: "Quote sent" });

      await TurboQuote.sendQuote("q-1", { ccEmails: ["admin@example.com"] });

      const body = mockClient.post.mock.calls[0][1];
      for (const key of SCHEDULE_KEYS) {
        expect(body).not.toHaveProperty(key);
      }
    });

    // `false` and `0` are meaningful, not "unset" — dropping them would silently fall back to the
    // org default, the opposite of what the caller asked for.
    it("preserves the meaningful zeros: maxReminders:0 and expirationEnabled:false", async () => {
      mockClient.post.mockResolvedValue({ result: { id: "q-1", status: "sent" }, message: "Quote sent" });

      await TurboQuote.sendQuote("q-1", { maxReminders: 0, expirationEnabled: false });

      const body = mockClient.post.mock.calls[0][1];
      expect(body.maxReminders).toBe(0);
      expect(body.expirationEnabled).toBe(false);
    });
  });

  describe("sendQuoteWithDeliverable — JSON send path", () => {
    it("carries the schedule FLAT alongside the deliverable fields", async () => {
      mockClient.post.mockResolvedValue({ result: { id: "q-1", status: "sent" }, message: "Sent", documentId: "doc-2" });

      await TurboQuote.sendQuoteWithDeliverable("q-1", {
        deliverableId: "del-1",
        mergePosition: "end",
        remindersEnabled: true,
        reminderDelay: { value: 2, unit: "days" },
        expirationEnabled: false,
      });

      const body = mockClient.post.mock.calls[0][1];
      expect(body).not.toHaveProperty("schedule");
      expect(body.deliverableId).toBe("del-1");
      expect(body.remindersEnabled).toBe(true);
      expect(body.reminderDelay).toEqual({ value: 2, unit: "days" });
      expect(body.expirationEnabled).toBe(false);
    });
  });

  describe("createAndSend — schedule rides on the send step", () => {
    it("emits the flat schedule on the /send request body", async () => {
      const quote = { id: "q-1", name: "Enterprise License", status: "draft" };
      mockClient.post
        .mockResolvedValueOnce({ result: quote, message: "Quote created successfully" })
        .mockResolvedValueOnce({ result: { ...quote, status: "sent" }, message: "Sent" });

      await TurboQuote.createAndSend({
        name: "Enterprise License",
        companyId: "c-1",
        contactId: "ct-1",
        send: {
          remindersEnabled: true,
          maxReminders: 0,
          reminderDelay: { value: 1, unit: "days" },
        },
      });

      const postCalls = mockClient.post.mock.calls;
      expect(postCalls[0][0]).toBe("/v1/quotes");
      expect(postCalls[1][0]).toBe("/v1/quotes/q-1/send");

      const sendBody = postCalls[1][1];
      expect(sendBody).not.toHaveProperty("schedule");
      expect(sendBody.remindersEnabled).toBe(true);
      expect(sendBody.maxReminders).toBe(0);
      expect(sendBody.reminderDelay).toEqual({ value: 1, unit: "days" });
    });
  });
});
