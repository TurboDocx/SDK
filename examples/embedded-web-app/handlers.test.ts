import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock external boundaries only: the SDK and the filesystem read. The handlers' own logic runs real.
vi.mock("@turbodocx/sdk", () => ({
  TurboSign: {
    createEmbeddedSignature: vi.fn(),
    createSigningUrl: vi.fn(),
    sendSignature: vi.fn(),
  },
}));
vi.mock("node:fs/promises", () => ({ readFile: vi.fn(async () => Buffer.from("%PDF-1.4 fake")) }));

import { TurboSign } from "@turbodocx/sdk";

import { externalIdv, kioskNext, kioskStart, single } from "./handlers";

const mockCreate = vi.mocked(TurboSign.createEmbeddedSignature);
const mockSigningUrl = vi.mocked(TurboSign.createSigningUrl);
const mockSend = vi.mocked(TurboSign.sendSignature);

describe("single", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the minted URL and identity mode for a ready recipient", async () => {
    // Arrange: SDK returns one ready recipient with a URL.
    mockCreate.mockResolvedValue({
      documentId: "doc-1",
      recipients: [{ recipientId: "r1", name: "Alex", email: "a@x.com", embedUrl: "https://app/embed/doc-1?token=abc", status: "ready", identityVerificationMode: "otp" }],
    } as never);

    // Act
    const res = await single({ name: "Alex", email: "a@x.com" });

    // Assert: shaped response + the SDK was asked for an email-OTP single recipient.
    expect(res).toEqual({ url: "https://app/embed/doc-1?token=abc", mode: "otp" });
    const arg = mockCreate.mock.calls[0][0] as { recipients: Array<{ auth?: unknown; email: string }> };
    expect(arg.recipients).toHaveLength(1);
    expect(arg.recipients[0].email).toBe("a@x.com");
    expect(arg.recipients[0].auth).toEqual({ emailOtp: true });
  });

  it("throws when the recipient has no embed URL (not their turn / already signed)", async () => {
    // Arrange: a recipient with a null URL (e.g. pending).
    mockCreate.mockResolvedValue({
      documentId: "doc-1",
      recipients: [{ recipientId: "r1", name: "Alex", email: "a@x.com", embedUrl: null, status: "pending", identityVerificationMode: "otp" }],
    } as never);

    // Act & Assert
    await expect(single({ name: "Alex", email: "a@x.com" })).rejects.toThrow(/Cannot start signing: recipient is pending/);
  });
});

describe("externalIdv", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets external_idv on the recipient, asserts the matching identity, and returns the minted URL", async () => {
    // Arrange: sendSignature returns the created doc + recipient; createSigningUrl mints the URL.
    mockSend.mockResolvedValue({
      success: true,
      documentId: "doc-3",
      status: "created",
      recipients: [{ id: "r7", name: "Alex", email: "a@x.com" }],
      message: "ok",
    } as never);
    mockSigningUrl.mockResolvedValue({ url: "https://app/embed/doc-3?token=idv", identityVerificationMode: "external_idv" } as never);

    // Act
    const res = await externalIdv({ name: "Alex", email: "a@x.com" });

    // Assert: shaped response with the external_idv mode + the simulated assertion the demo fabricated.
    expect(res.url).toBe("https://app/embed/doc-3?token=idv");
    expect(res.mode).toBe("external_idv");
    expect(res.simulatedAssertion).toMatchObject({ provider: "simulated-idp", subjectEmail: "a@x.com" });
    expect(res.simulatedAssertion.verificationId).toMatch(/^sim-idv-/);
    // The evidenceUrl must name the same verification record it was minted alongside.
    expect(res.simulatedAssertion.evidenceUrl).toBe(
      `https://simulated-idp.example/verifications/${res.simulatedAssertion.verificationId}`,
    );

    // Assert: sent without recipient emails, with an external_idv recipient.
    const sendArg = mockSend.mock.calls[0][0] as {
      sendEmail?: boolean;
      recipients: Array<{ email: string; identityVerification?: { mode?: string } }>;
    };
    expect(sendArg.sendEmail).toBe(false);
    expect(sendArg.recipients).toHaveLength(1);
    expect(sendArg.recipients[0].identityVerification?.mode).toBe("external_idv");

    // Assert: the URL was minted for that recipient with an assertion whose subjectEmail matches.
    const [docId, opts] = mockSigningUrl.mock.calls[0] as [
      string,
      { recipientId?: string; identityAssertion?: { subjectEmail?: string } },
    ];
    expect(docId).toBe("doc-3");
    expect(opts.recipientId).toBe("r7");
    expect(opts.identityAssertion?.subjectEmail).toBe("a@x.com");
  });

  it("carries the simulated verification fields and records the override when the asserted email differs", async () => {
    // Arrange: sendSignature returns the created doc + recipient; createSigningUrl mints the URL.
    mockSend.mockResolvedValue({
      success: true,
      documentId: "doc-4",
      status: "created",
      recipients: [{ id: "r9", name: "Alex", email: "signer@work.com" }],
      message: "ok",
    } as never);
    mockSigningUrl.mockResolvedValue({ url: "https://app/embed/doc-4?token=idv", identityVerificationMode: "external_idv" } as never);

    // Act: the operator asserts a personal email that differs from the signer's work email.
    const res = await externalIdv({
      name: "Alex",
      email: "signer@work.com",
      verification: {
        verifiedName: "Alexandra Rivera",
        subjectEmail: "alex@personal.com",
        method: "id_document_liveness",
        assuranceLevel: "ial2_aal2",
        overrideEmailMatching: true,
      },
    });

    // Assert: the assertion carries the richer fields, the asserted (not signer) email, and the override.
    expect(res.simulatedAssertion).toMatchObject({
      provider: "simulated-idp",
      subjectEmail: "alex@personal.com",
      verifiedName: "Alexandra Rivera",
      method: "id_document_liveness",
      assuranceLevel: "ial2_aal2",
      overrideEmailMatching: true,
    });

    // Assert: the identity assertion minted for the URL matches what was echoed back.
    const [, opts] = mockSigningUrl.mock.calls[0] as [
      string,
      { identityAssertion?: { subjectEmail?: string; overrideEmailMatching?: boolean } },
    ];
    expect(opts.identityAssertion?.subjectEmail).toBe("alex@personal.com");
    expect(opts.identityAssertion?.overrideEmailMatching).toBe(true);
  });

  it("falls back to the signer's email and omits the optional fields when no verification block is sent", async () => {
    // Arrange
    mockSend.mockResolvedValue({
      success: true,
      documentId: "doc-5",
      status: "created",
      recipients: [{ id: "r10", name: "Alex", email: "a@x.com" }],
      message: "ok",
    } as never);
    mockSigningUrl.mockResolvedValue({ url: "https://app/embed/doc-5?token=idv", identityVerificationMode: "external_idv" } as never);

    // Act: no verification block at all — the fallback path.
    const res = await externalIdv({ name: "Alex", email: "a@x.com" });

    // Assert: subjectEmail falls back to the signer, no override, evidenceUrl still present.
    expect(res.simulatedAssertion.subjectEmail).toBe("a@x.com");
    expect(res.simulatedAssertion.overrideEmailMatching).toBeUndefined();
    expect(res.simulatedAssertion.method).toBeUndefined();
  });

  it("throws when sendSignature does not return the matching recipient", async () => {
    // Arrange: the created recipient's email does not match the requested signer.
    mockSend.mockResolvedValue({
      success: true,
      documentId: "doc-3",
      status: "created",
      recipients: [{ id: "r7", name: "Someone", email: "other@x.com" }],
      message: "ok",
    } as never);

    // Act & Assert: cannot mint a URL without the recipient id.
    await expect(externalIdv({ name: "Alex", email: "a@x.com" })).rejects.toThrow(/did not return the recipient/);
    expect(mockSigningUrl).not.toHaveBeenCalled();
  });
});

describe("kioskStart", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends signers with an explicit signing order and per-signer anchor, and passes through status/URL", async () => {
    // Arrange: signer 1 ready (URL), signer 2 pending (null) — the turn-aware split.
    mockCreate.mockResolvedValue({
      documentId: "doc-9",
      recipients: [
        { recipientId: "r1", name: "Alex", email: "a@x.com", embedUrl: "https://app/embed/doc-9?token=1", status: "ready", identityVerificationMode: "otp" },
        { recipientId: "r2", name: "Sam", email: "s@x.com", embedUrl: null, status: "pending", identityVerificationMode: "otp" },
      ],
    } as never);

    // Act
    const res = await kioskStart([{ name: "Alex", email: "a@x.com" }, { name: "Sam", email: "s@x.com" }]);

    // Assert: response mapping.
    expect(res.documentId).toBe("doc-9");
    expect(res.recipients).toEqual([
      { recipientId: "r1", name: "Alex", email: "a@x.com", embedUrl: "https://app/embed/doc-9?token=1", status: "ready" },
      { recipientId: "r2", name: "Sam", email: "s@x.com", embedUrl: null, status: "pending" },
    ]);
    // Assert: the SDK got both signers in order with distinct anchors.
    const arg = mockCreate.mock.calls[0][0] as { recipients: Array<{ signingOrder: number; fields: { signature: string } }> };
    expect(arg.recipients.map((r) => r.signingOrder)).toEqual([1, 2]);
    expect(arg.recipients.map((r) => r.fields.signature)).toEqual(["{signature1}", "{signature2}"]);
  });
});

describe("kioskNext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mints the next signer's URL via createSigningUrl", async () => {
    // Arrange
    mockSigningUrl.mockResolvedValue({ url: "https://app/embed/doc-9?token=2", identityVerificationMode: "otp" } as never);

    // Act
    const res = await kioskNext({ documentId: "doc-9", recipientId: "r2" });

    // Assert: returns the URL and selected the right recipient/document.
    expect(res).toEqual({ url: "https://app/embed/doc-9?token=2" });
    expect(mockSigningUrl).toHaveBeenCalledWith("doc-9", { recipientId: "r2" });
  });
});
