import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mintNext, mintNextWithRetry, startKiosk, startSingleSigner } from "./turbosign";

function mockFetchOnce(status: number, body: unknown) {
  (globalThis.fetch as unknown) = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
}

describe("frontend api client (turbosign.ts)", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("startSingleSigner POSTs /api/single and returns the parsed result", async () => {
    // Arrange
    mockFetchOnce(200, { url: "https://app/embed/doc-1?token=abc", mode: "otp" });

    // Act
    const res = await startSingleSigner({ name: "Alex", email: "a@x.com" });

    // Assert: right endpoint + method + body, and the parsed response.
    expect(res).toEqual({ url: "https://app/embed/doc-1?token=abc", mode: "otp" });
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock.mock.calls[0][0]).toBe("/api/single");
    const init = fetchMock.mock.calls[0][1] as { method: string; body: string };
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ name: "Alex", email: "a@x.com" });
  });

  it("startKiosk POSTs /api/kiosk/start with the signers array", async () => {
    // Arrange
    mockFetchOnce(200, { documentId: "doc-9", recipients: [] });

    // Act
    const res = await startKiosk([{ name: "Alex", email: "a@x.com" }, { name: "Sam", email: "s@x.com" }]);

    // Assert
    expect(res.documentId).toBe("doc-9");
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock.mock.calls[0][0]).toBe("/api/kiosk/start");
    expect(JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)).toEqual({
      signers: [{ name: "Alex", email: "a@x.com" }, { name: "Sam", email: "s@x.com" }],
    });
  });

  it("mintNext POSTs /api/kiosk/next and unwraps the url", async () => {
    // Arrange
    mockFetchOnce(200, { url: "https://app/embed/doc-9?token=2" });

    // Act
    const url = await mintNext({ documentId: "doc-9", recipientId: "r2" });

    // Assert
    expect(url).toBe("https://app/embed/doc-9?token=2");
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock.mock.calls[0][0]).toBe("/api/kiosk/next");
  });

  it("throws the server's error message on a non-2xx response", async () => {
    // Arrange: server returns a 500 with an { error } body.
    mockFetchOnce(500, { error: "Cannot start signing: recipient is pending." });

    // Act & Assert
    await expect(startSingleSigner({ name: "Alex", email: "a@x.com" })).rejects.toThrow(
      /Cannot start signing: recipient is pending/,
    );
  });

  it("mintNextWithRetry retries on 'not your turn' then succeeds once the turn advances", async () => {
    // Arrange: the backend turn lags — first mint says not-in-turn, the second succeeds.
    const responses = [
      { ok: false, status: 409, json: async () => ({ error: "It is not your turn to sign this document yet." }) },
      { ok: true, status: 200, json: async () => ({ url: "https://app/embed/doc-9?token=2" }) },
    ];
    let call = 0;
    (globalThis.fetch as unknown) = vi.fn(async () => responses[call++]);

    // Act (tiny delay so the test is fast)
    const url = await mintNextWithRetry({ documentId: "doc-9", recipientId: "r2" }, { delayMs: 1 });

    // Assert: it retried and returned the URL from the second call.
    expect(url).toBe("https://app/embed/doc-9?token=2");
    expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
  });

  it("mintNextWithRetry rethrows a non-turn error immediately without retrying", async () => {
    // Arrange: a genuine failure (not a turn race).
    mockFetchOnce(500, { error: "Document not found" });

    // Act & Assert: no retry, error propagates.
    await expect(mintNextWithRetry({ documentId: "doc-9", recipientId: "r2" }, { delayMs: 1, retries: 5 })).rejects.toThrow(
      /Document not found/,
    );
    expect((globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });
});
