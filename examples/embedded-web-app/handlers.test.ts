import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock external boundaries only: the SDK and the filesystem read. The handlers' own logic runs real.
vi.mock("@turbodocx/sdk", () => ({
  TurboSign: {
    createEmbeddedSignature: vi.fn(),
    createSigningUrl: vi.fn(),
  },
}));
vi.mock("node:fs/promises", () => ({ readFile: vi.fn(async () => Buffer.from("%PDF-1.4 fake")) }));

import { TurboSign } from "@turbodocx/sdk";

import { kioskNext, kioskStart, single } from "./handlers";

const mockCreate = vi.mocked(TurboSign.createEmbeddedSignature);
const mockSigningUrl = vi.mocked(TurboSign.createSigningUrl);

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
