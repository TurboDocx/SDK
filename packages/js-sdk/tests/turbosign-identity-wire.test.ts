/**
 * Wire-contract tests for the embedded-identity SDK methods. Unlike turbosign-identity.test.ts
 * (which mocks HttpClient and returns the already-unwrapped { results } shape), these use the REAL
 * HttpClient with a mocked `fetch`, so the actual server envelope { data: { results } } flows
 * through smartUnwrap + the handler's `.results` unwrap. This is what catches a silent break if the
 * backend response shape or the client unwrap ever drifts.
 */
import { TurboSign } from "../src/modules/sign";

function mockFetchOnce(body: unknown, ok = true, status = 200): void {
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    headers: { get: () => "application/json" },
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

describe("TurboSign embedded identity — real wire contract (smartUnwrap)", () => {
  beforeEach(() => {
    TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
  });

  it("createSigningUrl unwraps the { data: { results } } server envelope to the flat response", async () => {
    const results = { url: "https://app/e-signature/sign/doc-1?token=AT", expiresAt: null, recipientId: "rec-1", identityVerificationMode: "otp", pendingChecks: ["email_otp"] };
    // The server responds { data: { results } }; the client strips `data`, the handler strips `results`.
    mockFetchOnce({ data: { results } });

    const res = await TurboSign.createSigningUrl("doc-1", { recipientId: "rec-1" });

    expect(res.url).toBe(results.url);
    expect(res.pendingChecks).toEqual(["email_otp"]);
    // Must be the flat response, never the { results: ... } wrapper.
    expect((res as unknown as { results?: unknown }).results).toBeUndefined();
  });

  it("getEmbeddedSigningSettings unwraps the { data: { results } } server envelope", async () => {
    const results = { enabled: true, allowExternalIdv: false, allowIdentityOverride: false, defaultChannel: "email", allowedFrameAncestors: ["https://app.baers.com"] };
    mockFetchOnce({ data: { results } });

    const res = await TurboSign.getEmbeddedSigningSettings();

    expect(res.enabled).toBe(true);
    expect(res.allowedFrameAncestors).toEqual(["https://app.baers.com"]);
    expect((res as unknown as { results?: unknown }).results).toBeUndefined();
  });
});
