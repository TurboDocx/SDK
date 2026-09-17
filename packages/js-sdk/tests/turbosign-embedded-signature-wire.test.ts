/**
 * Wire-contract tests for TurboSign.createEmbeddedSignature. Uses the REAL HttpClient with a mocked
 * `fetch` (like turbosign-identity-wire.test.ts) so the actual server envelopes flow through the
 * client's smartUnwrap:
 *   - sendSignature responds { data: { ...flat fields... } } (no `results` unwrap).
 *   - createSigningUrl responds { data: { results: {...} } } (handler strips `results`).
 * We use `templateId` (no `file`) so sendSignature takes the JSON `client.post` path and we can read
 * the request body off the fetch mock. Bodies are double-encoded: the whole body is JSON.stringify'd
 * and `recipients`/`fields` are themselves JSON strings inside it.
 */
import { TurboSign } from "../src/modules/sign";

/** The flat sendSignature envelope: { data: { ...fields... } }. */
function sendEnvelope(documentId: string, recipients: Array<{ id: string; name: string; email: string }>): unknown {
  return { data: { success: true, documentId, status: "under_review", recipients, message: "ok" } };
}

/** The createSigningUrl envelope: { data: { results: {...} } }. */
function signingUrlEnvelope(recipientId: string, url: string, mode: string | null): unknown {
  return { data: { results: { url, expiresAt: null, recipientId, identityVerificationMode: mode, pendingChecks: mode === "otp" ? ["email_otp"] : [] } } };
}

/** The JSON body that the real client POSTed on the Nth fetch call. */
function bodyOf(call: number): any {
  const mock = (global as unknown as { fetch: jest.Mock }).fetch;
  return JSON.parse(mock.mock.calls[call][1].body as string);
}

describe("TurboSign.createEmbeddedSignature — real wire contract", () => {
  beforeEach(() => {
    TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
  });

  it("calls sendSignature once then createSigningUrl once per recipient, returning per-recipient embedUrl + mode in order", async () => {
    const fetchMock = jest
      .fn()
      // 1st call: sendSignature
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => sendEnvelope("doc-1", [
          { id: "rec-1", name: "Alice", email: "alice@example.com" },
          { id: "rec-2", name: "Bob", email: "bob@example.com" },
        ]),
        text: async () => "",
      })
      // 2nd call: createSigningUrl for the first-in-order recipient (Bob, signingOrder 1)
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => signingUrlEnvelope("rec-2", "https://app/sign/doc-1?token=BOB", "otp"),
        text: async () => "",
      })
      // 3rd call: createSigningUrl for the second-in-order recipient (Alice, signingOrder 2)
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => signingUrlEnvelope("rec-1", "https://app/sign/doc-1?token=ALICE", "otp"),
        text: async () => "",
      });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    // Deliberately out of array order: Alice is index 0 but signs 2nd, Bob is index 1 but signs 1st.
    const res = await TurboSign.createEmbeddedSignature({
      templateId: "tmpl-1",
      documentName: "Contract",
      recipients: [
        { name: "Alice", email: "alice@example.com", signingOrder: 2, auth: { emailOtp: true } },
        { name: "Bob", email: "bob@example.com", signingOrder: 1, auth: { emailOtp: true } },
      ],
      fields: [{ type: "signature", recipientEmail: "alice@example.com", template: { anchor: "{sig}", placement: "replace", size: { width: 100, height: 30 } } }],
    });

    // One sendSignature + one createSigningUrl per recipient = 3 fetches total.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain("/turbosign/single/prepare-for-signing");
    expect(fetchMock.mock.calls[1][0]).toContain("/turbosign/documents/doc-1/signing-url");
    expect(fetchMock.mock.calls[2][0]).toContain("/turbosign/documents/doc-1/signing-url");

    // Results are IN SIGNING ORDER: Bob (order 1) first, Alice (order 2) second.
    expect(res.documentId).toBe("doc-1");
    expect(res.recipients.map((r) => r.name)).toEqual(["Bob", "Alice"]);
    expect(res.recipients[0].recipientId).toBe("rec-2");
    expect(res.recipients[0].embedUrl).toBe("https://app/sign/doc-1?token=BOB");
    expect(res.recipients[0].identityVerificationMode).toBe("otp");
    expect(res.recipients[1].name).toBe("Alice");
    expect(res.recipients[1].embedUrl).toBe("https://app/sign/doc-1?token=ALICE");

    // The signing-url call selected each recipient by the id sendSignature returned.
    expect(bodyOf(1).recipientId).toBe("rec-2");
    expect(bodyOf(2).recipientId).toBe("rec-1");
  });

  it("maps auth.emailOtp to identityVerification { mode:'otp', channel:'email' } in the sendSignature payload", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => sendEnvelope("doc-2", [{ id: "rec-1", name: "Alice", email: "alice@example.com" }]),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => signingUrlEnvelope("rec-1", "https://app/sign/doc-2?token=A", "otp"),
        text: async () => "",
      });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    await TurboSign.createEmbeddedSignature({
      templateId: "tmpl-1",
      recipients: [{ name: "Alice", email: "alice@example.com", auth: { emailOtp: true } }],
    });

    // sendSignature JSON-encodes recipients into the body; the whole body is also JSON-encoded.
    const recipients = JSON.parse(bodyOf(0).recipients);
    expect(recipients[0].identityVerification).toEqual({ mode: "otp", channel: "email" });
    // signingOrder defaults to index + 1.
    expect(recipients[0].signingOrder).toBe(1);
    // Embedded flow suppresses recipient emails by default.
    expect(bodyOf(0).sendEmail).toBe(false);
  });

  it("maps auth.sms to identityVerification { mode:'otp', channel:'sms' } and sets the recipient phone", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => sendEnvelope("doc-3", [{ id: "rec-1", name: "Alice", email: "alice@example.com" }]),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => signingUrlEnvelope("rec-1", "https://app/sign/doc-3?token=A", "otp"),
        text: async () => "",
      });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    await TurboSign.createEmbeddedSignature({
      templateId: "tmpl-1",
      recipients: [{ name: "Alice", email: "alice@example.com", auth: { sms: { phoneNumber: "+13055551234" } } }],
    });

    const recipients = JSON.parse(bodyOf(0).recipients);
    expect(recipients[0].identityVerification).toEqual({ mode: "otp", channel: "sms" });
    expect(recipients[0].phone).toBe("+13055551234");
  });

  it("expands the fields shorthand into Field objects with placement:'replace' and the default sizes", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => sendEnvelope("doc-4", [{ id: "rec-1", name: "Alice", email: "alice@example.com" }]),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => signingUrlEnvelope("rec-1", "https://app/sign/doc-4?token=A", null),
        text: async () => "",
      });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    await TurboSign.createEmbeddedSignature({
      templateId: "tmpl-1",
      recipients: [
        {
          name: "Alice",
          email: "alice@example.com",
          fields: { signature: "{signature1}", date: "{date1}", initials: "{initials1}", fullName: "{fullName1}" },
        },
      ],
    });

    const fields = JSON.parse(bodyOf(0).fields);
    expect(fields).toHaveLength(4);

    const signature = fields.find((f: { type: string }) => f.type === "signature");
    expect(signature).toEqual({
      type: "signature",
      recipientEmail: "alice@example.com",
      template: { anchor: "{signature1}", placement: "replace", size: { width: 100, height: 30 } },
    });

    const date = fields.find((f: { type: string }) => f.type === "date");
    expect(date.template.size).toEqual({ width: 75, height: 30 });

    // The `initials` shorthand emits the 'initial' field type (the SignatureFieldType literal).
    const initial = fields.find((f: { type: string }) => f.type === "initial");
    expect(initial).toBeDefined();
    expect(initial.template).toEqual({ anchor: "{initials1}", placement: "replace", size: { width: 50, height: 30 } });

    const fullName = fields.find((f: { type: string }) => f.type === "full_name");
    expect(fullName.template.size).toEqual({ width: 150, height: 30 });
  });

  it("returns 2 results in signing order for a 2-recipient request", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => sendEnvelope("doc-5", [
          { id: "rec-1", name: "First", email: "first@example.com" },
          { id: "rec-2", name: "Second", email: "second@example.com" },
        ]),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => signingUrlEnvelope("rec-1", "https://app/sign/doc-5?token=1", null),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
        json: async () => signingUrlEnvelope("rec-2", "https://app/sign/doc-5?token=2", null),
        text: async () => "",
      });
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

    const res = await TurboSign.createEmbeddedSignature({
      templateId: "tmpl-1",
      recipients: [
        { name: "First", email: "first@example.com" },
        { name: "Second", email: "second@example.com" },
      ],
    });

    expect(res.recipients).toHaveLength(2);
    expect(res.recipients.map((r) => r.email)).toEqual(["first@example.com", "second@example.com"]);
    expect(res.recipients.map((r) => r.embedUrl)).toEqual([
      "https://app/sign/doc-5?token=1",
      "https://app/sign/doc-5?token=2",
    ]);
  });
});
