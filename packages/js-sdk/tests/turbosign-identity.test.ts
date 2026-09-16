/**
 * TurboSign embedded identity-verification tests:
 * - createSigningUrl (selectors, returnUrl, request passthrough)
 * - client-side recipient identityVerification validation (fail fast)
 */

import { TurboSign } from "../src/modules/sign";
import { HttpClient } from "../src/http";
import { ValidationError } from "../src/utils/errors";
import type { Recipient } from "../src/types/sign";

jest.mock("../src/http");

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe("TurboSign embedded identity verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TurboSign as any).client = undefined;
    MockedHttpClient.prototype.getSenderConfig = jest.fn().mockReturnValue({
      senderEmail: "test@company.com",
      senderName: "Test Company",
    });
  });

  describe("createSigningUrl", () => {
    const okResponse = {
      url: "https://app.turbodocx.com/e-signature/sign/doc-1?sut=tok",
      expiresAt: "2026-09-16T12:05:00Z",
      recipientId: "rec-1",
      externalId: "cust_1",
      identityVerificationMode: "external_idv",
      pendingChecks: [],
    };

    it("posts to the signing-url endpoint and returns the response", async () => {
      // The real client returns the { results } envelope (the outer { data } is stripped for it).
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({ results: okResponse });
      TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });

      const res = await TurboSign.createSigningUrl("doc-1", { externalId: "cust_1" });

      expect(res.url).toContain("/e-signature/sign/doc-1");
      expect(res.identityVerificationMode).toBe("external_idv");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith("/turbosign/documents/doc-1/signing-url", {
        externalId: "cust_1",
      });
    });

    it("passes an identity assertion through for external_idv", async () => {
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({ results: okResponse });
      TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });

      const identityAssertion = {
        provider: "CAPA",
        verificationId: "capa_1",
        verifiedAt: "2026-09-16T11:59:00Z",
        subjectEmail: "jane@acme.com",
      };
      await TurboSign.createSigningUrl("doc-1", { recipientId: "rec-1", identityAssertion });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/documents/doc-1/signing-url",
        expect.objectContaining({ recipientId: "rec-1", identityAssertion })
      );
    });

    it("rejects zero selectors before any HTTP call", async () => {
      MockedHttpClient.prototype.post = jest.fn();
      TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });

      await expect(TurboSign.createSigningUrl("doc-1", {})).rejects.toThrow(ValidationError);
      expect(MockedHttpClient.prototype.post).not.toHaveBeenCalled();
    });

    it("rejects two selectors", async () => {
      TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
      await expect(
        TurboSign.createSigningUrl("doc-1", { recipientId: "rec-1", externalId: "cust_1" })
      ).rejects.toMatchObject({ code: "RecipientSelectorInvalid" });
    });

    it("rejects a non-https returnUrl", async () => {
      TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
      await expect(
        TurboSign.createSigningUrl("doc-1", { recipientId: "rec-1", returnUrl: "http://app.test" })
      ).rejects.toMatchObject({ code: "InvalidReturnUrl" });
    });
  });

  describe("getEmbeddedSigningSettings", () => {
    it("GETs the settings endpoint and unwraps the results envelope", async () => {
      const settings = {
        enabled: true,
        allowExternalIdv: true,
        allowIdentityOverride: false,
        defaultChannel: "email",
        allowedFrameAncestors: ["https://app.example.com"],
      };
      // Same envelope the real client yields for a { data: { results } } response.
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue({ results: settings });
      TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });

      const res = await TurboSign.getEmbeddedSigningSettings();

      expect(res).toEqual(settings);
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith("/turbosign/embedded-signing-settings");
    });
  });

  describe("recipient identityVerification validation (sendSignature)", () => {
    const baseSend = (recipients: Recipient[]) => {
      TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({ success: true });
      MockedHttpClient.prototype.uploadFile = jest.fn().mockResolvedValue({ success: true });
      return TurboSign.sendSignature({ fileLink: "https://x/f.pdf", recipients, fields: [] });
    };

    it("rejects override without literal boolean true (string 'true' is not acknowledgement)", async () => {
      const recipients = [
        {
          name: "Dev",
          email: "dev@acme.com",
          signingOrder: 1,
          identityVerification: { mode: "override", overrideIdentityVerification: "true", reason: "x" },
        },
      ] as unknown as Recipient[];
      await expect(baseSend(recipients)).rejects.toMatchObject({ code: "OverrideNotAcknowledged" });
      expect(MockedHttpClient.prototype.post).not.toHaveBeenCalled();
    });

    it("rejects override with an empty reason", async () => {
      const recipients: Recipient[] = [
        {
          name: "Dev",
          email: "dev@acme.com",
          signingOrder: 1,
          identityVerification: { mode: "override", overrideIdentityVerification: true, reason: "  " },
        },
      ];
      await expect(baseSend(recipients)).rejects.toMatchObject({ code: "OverrideNotAcknowledged" });
    });

    it("rejects external_idv without a provider", async () => {
      const recipients: Recipient[] = [
        {
          name: "Jane",
          email: "jane@acme.com",
          signingOrder: 1,
          identityVerification: { mode: "external_idv", provider: "" },
        },
      ];
      await expect(baseSend(recipients)).rejects.toMatchObject({ code: "IdvProviderRequired" });
    });

    it("rejects otp+sms without a phone", async () => {
      const recipients: Recipient[] = [
        {
          name: "Jane",
          email: "jane@acme.com",
          signingOrder: 1,
          identityVerification: { mode: "otp", channel: "sms" },
        },
      ];
      await expect(baseSend(recipients)).rejects.toMatchObject({ code: "PhoneRequiredForSmsOtp" });
    });

    it("accepts a valid override recipient (validation passes, request is sent)", async () => {
      const recipients: Recipient[] = [
        {
          name: "Dev",
          email: "dev@acme.com",
          signingOrder: 1,
          identityVerification: { mode: "override", overrideIdentityVerification: true, reason: "Sandbox" },
        },
      ];
      await expect(baseSend(recipients)).resolves.toBeDefined();
    });
  });
});
