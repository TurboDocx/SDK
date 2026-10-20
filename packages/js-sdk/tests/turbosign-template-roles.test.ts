/**
 * Template signer roles: a template set up in the TurboDocx UI (signers + fields dragged onto the
 * PDF) is sent by naming each signer's role. Uses the REAL HttpClient with a mocked `fetch`, so the
 * request body asserted here is exactly what goes over the wire. Bodies are double-encoded: the
 * whole body is JSON and `recipients`/`fields` are JSON strings inside it.
 */
import { TurboSign } from "../src/modules/sign";

const TEMPLATE_ID = "84759112-d9d6-443a-bb78-87c427bd7948";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    statusText: status < 400 ? "OK" : "Bad Request",
    headers: { get: () => "application/json" },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function fetchMock(): jest.Mock {
  return (global as unknown as { fetch: jest.Mock }).fetch;
}

function bodyOf(call: number): any {
  return JSON.parse(fetchMock().mock.calls[call][1].body as string);
}

describe("TurboSign template signer roles", () => {
  beforeEach(() => {
    TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "sender@company.com" });
  });

  describe("sendSignature", () => {
    it("sends each recipient's role and no fields key when fields are omitted (a role send)", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse({ data: { success: true, documentId: "doc-1", status: "under_review" } }));

      const result = await TurboSign.sendSignature({
        templateId: TEMPLATE_ID,
        recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }],
      });

      expect(result.documentId).toBe("doc-1");
      expect(fetchMock().mock.calls[0][0]).toContain("/turbosign/single/prepare-for-signing");
      const body = bodyOf(0);
      expect(body.templateId).toBe(TEMPLATE_ID);
      expect(JSON.parse(body.recipients)).toEqual([{ role: "client", name: "Jane Doe", email: "jane@client.com" }]);
      // A role send may leave fields out: the template's saved fields are used
      expect(body).not.toHaveProperty("fields");
    });

    it("still sends fields when they are given", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse({ data: { success: true, documentId: "doc-1", status: "under_review" } }));
      const fields = [
        { type: "signature", page: 1, x: 10, y: 20, width: 100, height: 30, recipientEmail: "jane@client.com" },
      ];

      await TurboSign.sendSignature({
        templateId: TEMPLATE_ID,
        recipients: [{ name: "Jane Doe", email: "jane@client.com", signingOrder: 1 }],
        fields: fields as any,
      });
      await TurboSign.createSignatureReviewLink({
        templateId: TEMPLATE_ID,
        recipients: [{ name: "Jane Doe", email: "jane@client.com", signingOrder: 1 }],
        fields: fields as any,
      });

      expect(JSON.parse(bodyOf(0).fields)).toEqual(fields);
      expect(JSON.parse(bodyOf(1).fields)).toEqual(fields);
    });

    it("leaves fields out when an empty list is given", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse({ data: { success: true, documentId: "doc-1", status: "under_review" } }));

      await TurboSign.sendSignature({
        templateId: TEMPLATE_ID,
        recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }],
        fields: [],
      });

      expect(bodyOf(0)).not.toHaveProperty("fields");
    });

    // Without roles the API answers a MISSING fields key with 400 FieldsRequired, but would send an
    // empty list as a document with nothing to sign. A send without fields must leave the key out.
    it("leaves fields out of a send with no fields and no roles, so the API rejects it", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse({ data: { success: true, documentId: "doc-1", status: "under_review" } }));

      await TurboSign.sendSignature({
        fileLink: "https://example.com/contract.pdf",
        recipients: [{ name: "Jane Doe", email: "jane@client.com", signingOrder: 1 }],
      });
      await TurboSign.sendSignature({
        fileLink: "https://example.com/contract.pdf",
        recipients: [{ name: "Jane Doe", email: "jane@client.com", signingOrder: 1 }],
        fields: [],
      });

      expect(bodyOf(0)).not.toHaveProperty("fields");
      expect(bodyOf(1)).not.toHaveProperty("fields");
    });

    it("surfaces the API's message when a role isn't on the template", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest.fn().mockResolvedValue(
        jsonResponse(
          {
            message: 'Unknown role "clinet". This template\'s roles are: client, countersigner',
            type: "UnknownSignerRole",
          },
          400
        )
      );

      await expect(
        TurboSign.sendSignature({
          templateId: TEMPLATE_ID,
          recipients: [{ role: "clinet", name: "Jane Doe", email: "jane@client.com" }],
        })
      ).rejects.toMatchObject({
        message: 'Unknown role "clinet". This template\'s roles are: client, countersigner',
        code: "UnknownSignerRole",
      });
    });
  });

  describe("createSignatureReviewLink", () => {
    it("sends roles to prepare-for-review with fields as [] when fields are omitted", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse({ data: { success: true, documentId: "doc-2", status: "review_ready" } }));

      await TurboSign.createSignatureReviewLink({
        templateId: TEMPLATE_ID,
        recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }],
      });

      expect(fetchMock().mock.calls[0][0]).toContain("/turbosign/single/prepare-for-review");
      expect(JSON.parse(bodyOf(0).recipients)[0].role).toBe("client");
      expect(bodyOf(0).fields).toBe("[]");
    });

    // Without roles the API answers a MISSING fields key with 400 FieldsRequired, but accepts an empty
    // list on a review link (the sender places fields in the preview). These calls worked in v0.8.0.
    it("sends fields as [] for a review link with fields: [] and no roles", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse({ data: { success: true, documentId: "doc-3", status: "review_ready" } }));

      await TurboSign.createSignatureReviewLink({
        fileLink: "https://example.com/contract.pdf",
        recipients: [{ name: "Jane Doe", email: "jane@client.com", signingOrder: 1 }],
        fields: [],
      });

      expect(fetchMock().mock.calls[0][0]).toContain("/turbosign/single/prepare-for-review");
      expect(bodyOf(0).fields).toBe("[]");
    });

    it("sends fields as [] for a review link with no fields argument and no roles", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse({ data: { success: true, documentId: "doc-4", status: "review_ready" } }));

      await TurboSign.createSignatureReviewLink({
        fileLink: "https://example.com/contract.pdf",
        recipients: [{ name: "Jane Doe", email: "jane@client.com", signingOrder: 1 }],
      });

      expect(bodyOf(0).fields).toBe("[]");
    });
  });

  describe("createEmbeddedSignature", () => {
    it("passes each recipient's role through to the send", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            data: {
              success: true,
              documentId: "doc-3",
              status: "under_review",
              recipients: [{ id: "rec-1", name: "Jane Doe", email: "jane@client.com" }],
            },
          })
        )
        .mockResolvedValueOnce(
          jsonResponse({
            data: { results: { url: "https://app/sign/doc-3?token=J", expiresAt: null, recipientId: "rec-1" } },
          })
        );

      const result = await TurboSign.createEmbeddedSignature({
        templateId: TEMPLATE_ID,
        recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }],
      });

      expect(JSON.parse(bodyOf(0).recipients)).toEqual([
        { name: "Jane Doe", email: "jane@client.com", signingOrder: 1, role: "client" },
      ]);
      expect(bodyOf(0)).not.toHaveProperty("fields");
      expect(result.recipients[0].embedUrl).toBe("https://app/sign/doc-3?token=J");
    });
  });

  describe("createEmbeddedSignature signing order with roles", () => {
    it("returns recipients in the template's signing order, not the order passed", async () => {
      // The template's roles sign client first; the API returns its signers in that order
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            data: {
              success: true,
              documentId: "doc-4",
              status: "under_review",
              recipients: [
                { id: "rec-client", name: "Jane Doe", email: "jane@client.com" },
                { id: "rec-counter", name: "Sam Lee", email: "sam@acme.com" },
              ],
            },
          })
        )
        .mockResolvedValueOnce(
          jsonResponse({ data: { results: { url: "https://app/sign?token=J", expiresAt: null, recipientId: "rec-client" } } })
        )
        .mockResolvedValueOnce(
          jsonResponse({ data: { results: { url: "https://app/sign?token=S", expiresAt: null, recipientId: "rec-counter" } } })
        );

      const result = await TurboSign.createEmbeddedSignature({
        templateId: TEMPLATE_ID,
        recipients: [
          { role: "countersigner", name: "Sam Lee", email: "sam@acme.com" },
          { role: "client", name: "Jane Doe", email: "jane@client.com" },
        ],
      });

      expect(result.recipients.map((r) => r.email)).toEqual(["jane@client.com", "sam@acme.com"]);
      expect(result.recipients.map((r) => r.embedUrl)).toEqual(["https://app/sign?token=J", "https://app/sign?token=S"]);
    });
  });

  describe("createEmbeddedSignature with a left-out role", () => {
    it("also mints an embed URL for the template's saved signer, in API order", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            data: {
              success: true,
              documentId: "doc-5",
              status: "under_review",
              recipients: [
                { id: "rec-client", name: "Jane Doe", email: "jane@client.com" },
                { id: "rec-counter", name: "Sam Lee", email: "Sam@Acme.com" },
              ],
            },
          })
        )
        .mockResolvedValueOnce(
          jsonResponse({ data: { results: { url: "https://app/sign?token=J", expiresAt: null, recipientId: "rec-client" } } })
        )
        .mockResolvedValueOnce(
          jsonResponse({ data: { results: { url: "https://app/sign?token=S", expiresAt: null, recipientId: "rec-counter" } } })
        );

      const result = await TurboSign.createEmbeddedSignature({
        templateId: TEMPLATE_ID,
        recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }],
      });

      expect(JSON.parse(bodyOf(0).recipients)).toHaveLength(1);
      expect(result.recipients.map((r) => r.email)).toEqual(["jane@client.com", "Sam@Acme.com"]);
      expect(result.recipients.map((r) => r.name)).toEqual(["Jane Doe", "Sam Lee"]);
      expect(result.recipients.map((r) => r.embedUrl)).toEqual(["https://app/sign?token=J", "https://app/sign?token=S"]);
      expect(result.recipients.map((r) => r.recipientId)).toEqual(["rec-client", "rec-counter"]);
    });

    it("gives the saved signer a null URL and pending status when it is not their turn", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            data: {
              success: true,
              documentId: "doc-6",
              status: "under_review",
              recipients: [
                { id: "rec-client", name: "Jane Doe", email: "jane@client.com" },
                { id: "rec-counter", name: "Sam Lee", email: "sam@acme.com" },
              ],
            },
          })
        )
        .mockResolvedValueOnce(
          jsonResponse({ data: { results: { url: "https://app/sign?token=J", expiresAt: null, recipientId: "rec-client" } } })
        )
        .mockResolvedValueOnce(
          jsonResponse({ message: "not your turn", code: "RecipientNotInTurn" }, 409)
        );

      const result = await TurboSign.createEmbeddedSignature({
        templateId: TEMPLATE_ID,
        recipients: [{ role: "client", name: "Jane Doe", email: "jane@client.com" }],
      });

      expect(result.recipients.map((r) => r.status)).toEqual(["ready", "pending"]);
      expect(result.recipients[1].embedUrl).toBeNull();
    });
  });

  describe("getTemplateSignatureSetup", () => {
    it("GETs the template's signer roles and unwraps the response", async () => {
      const summary = {
        templateId: TEMPLATE_ID,
        roles: [
          { key: "client", label: "Client", order: 1, hasSavedSigner: false, fieldCount: 3 },
          {
            key: "countersigner",
            label: "Countersigner",
            order: 2,
            hasSavedSigner: true,
            defaultName: "Sam Lee",
            defaultEmail: "sam@acme.com",
            fieldCount: 2,
          },
        ],
      };
      (global as unknown as { fetch: jest.Mock }).fetch = jest.fn().mockResolvedValue(jsonResponse({ data: summary }));

      const result = await TurboSign.getTemplateSignatureSetup(TEMPLATE_ID);

      expect(fetchMock().mock.calls[0][0]).toContain(`/turbosign/templates/${TEMPLATE_ID}/signature-setup`);
      expect(fetchMock().mock.calls[0][1].method).toBe("GET");
      expect(result).toEqual(summary);
    });

    it("URL-encodes the template id", async () => {
      (global as unknown as { fetch: jest.Mock }).fetch = jest
        .fn()
        .mockResolvedValue(jsonResponse({ data: { templateId: "a/b", roles: [] } }));

      await TurboSign.getTemplateSignatureSetup("a/b");

      expect(fetchMock().mock.calls[0][0]).toContain("/turbosign/templates/a%2Fb/signature-setup");
    });
  });
});
