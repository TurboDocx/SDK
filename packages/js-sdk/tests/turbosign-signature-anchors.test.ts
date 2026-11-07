/**
 * Template signature setups with anchored fields: a field tied to a template tag (like
 * "{ClientSign}") for one signer role. Uses the REAL HttpClient with a mocked `fetch`, so the
 * requests asserted here are exactly what goes over the wire.
 */
import { TurboSign } from "../src/modules/sign";
import { ConflictError, NotFoundError } from "../src/utils/errors";

const TEMPLATE_ID = "84759112-d9d6-443a-bb78-87c427bd7948";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    statusText: status < 400 ? "OK" : "Error",
    headers: { get: () => "application/json" },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function mockFetch(body: unknown, status = 200): jest.Mock {
  const fetch = jest.fn().mockResolvedValue(jsonResponse(body, status));
  (global as unknown as { fetch: jest.Mock }).fetch = fetch;
  return fetch;
}

const SAVED_SETUP = {
  roles: [{ roleId: "r1", label: "Signer 1", order: 1 }],
  fields: [{ roleId: "r1", type: "signature", anchor: "{ClientSign}", fieldId: "f1" }],
  savedOn: "2026-11-06T00:00:00.000Z",
};

describe("TurboSign anchored signature setup", () => {
  beforeEach(() => {
    TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "sender@company.com" });
  });

  describe("applySignatureSetup", () => {
    const anchoredField = {
      type: "signature" as const,
      recipientEmail: "jane@client.com",
      template: { anchor: "{ClientSign}" },
    };
    const recipients = [{ name: "Jane Doe", email: "jane@client.com", signingOrder: 1 }];

    it("sends applySignatureSetup: true on sendSignature and createSignatureReviewLink", async () => {
      const fetch = mockFetch({ data: { success: true, documentId: "doc-1", status: "under_review" } });

      await TurboSign.sendSignature({ templateId: TEMPLATE_ID, recipients, fields: [anchoredField], applySignatureSetup: true });
      await TurboSign.createSignatureReviewLink({ templateId: TEMPLATE_ID, recipients, fields: [anchoredField], applySignatureSetup: true });

      expect(JSON.parse(fetch.mock.calls[0][1].body).applySignatureSetup).toBe(true);
      expect(JSON.parse(fetch.mock.calls[1][1].body).applySignatureSetup).toBe(true);
    });

    it("forwards an explicit false and leaves the key out when omitted", async () => {
      const fetch = mockFetch({ data: { success: true, documentId: "doc-1", status: "under_review" } });

      await TurboSign.sendSignature({ templateId: TEMPLATE_ID, recipients, fields: [anchoredField], applySignatureSetup: false });
      await TurboSign.sendSignature({ templateId: TEMPLATE_ID, recipients, fields: [anchoredField] });

      expect(JSON.parse(fetch.mock.calls[0][1].body).applySignatureSetup).toBe(false);
      expect(JSON.parse(fetch.mock.calls[1][1].body)).not.toHaveProperty("applySignatureSetup");
    });

    it("sends it as a form field on a file upload", async () => {
      const fetch = mockFetch({ data: { success: true, documentId: "doc-1", status: "under_review" } });

      await TurboSign.sendSignature({
        file: Buffer.from("%PDF-1.4"),
        recipients,
        fields: [anchoredField],
        applySignatureSetup: true,
      });

      const form = fetch.mock.calls[0][1].body as FormData;
      expect(form.get("applySignatureSetup")).toBe("true");
    });
  });

  describe("getTemplateSignatureSetup", () => {
    it("returns each role's anchoredFieldCount and the template's anchors", async () => {
      const summary = {
        templateId: TEMPLATE_ID,
        roles: [{ key: "signer_1", label: "Signer 1", order: 1, hasSavedSigner: false, fieldCount: 1, anchoredFieldCount: 1 }],
        anchors: [{ fieldId: "f1", roleKey: "signer_1", type: "signature", anchor: "{ClientSign}", placement: "replace", notFound: false }],
      };
      mockFetch({ data: summary });

      const setup = await TurboSign.getTemplateSignatureSetup(TEMPLATE_ID);

      expect(setup.roles[0].anchoredFieldCount).toBe(1);
      expect(setup.anchors[0]).toEqual(summary.anchors[0]);
    });
  });

  describe("addTemplateSignatureAnchor", () => {
    it("POSTs the anchored field (without templateId) and returns the unwrapped result", async () => {
      const fetch = mockFetch({ data: { results: { fieldId: "f1", signatureSetup: SAVED_SETUP, tagBecameSignatureField: true } } });

      const result = await TurboSign.addTemplateSignatureAnchor({
        templateId: TEMPLATE_ID,
        roleKey: "signer_1",
        type: "signature",
        anchor: "{ClientSign}",
        size: { width: 120, height: 30 },
        offset: { x: 0, y: 5 },
        placement: "replace",
      });

      const [url, init] = fetch.mock.calls[0];
      expect(url).toContain(`/turbosign/templates/${TEMPLATE_ID}/signature-setup/anchors`);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        roleKey: "signer_1",
        type: "signature",
        anchor: "{ClientSign}",
        size: { width: 120, height: 30 },
        offset: { x: 0, y: 5 },
        placement: "replace",
      });
      expect(result).toEqual({ fieldId: "f1", signatureSetup: SAVED_SETUP, tagBecameSignatureField: true });
    });

    it("surfaces a tag owned by another role as ConflictError with its code", async () => {
      mockFetch(
        { message: "The tag {ClientSign} already belongs to another signer.", type: "AnchorOwnedByOtherRole", error: "x", code: "AnchorOwnedByOtherRole" },
        409
      );

      await expect(
        TurboSign.addTemplateSignatureAnchor({ templateId: TEMPLATE_ID, roleKey: "signer_2", type: "signature", anchor: "{ClientSign}" })
      ).rejects.toMatchObject({ constructor: ConflictError, code: "AnchorOwnedByOtherRole" });
    });
  });

  describe("removeTemplateSignatureAnchor", () => {
    it("DELETEs the field by id and returns the remaining setup", async () => {
      const fetch = mockFetch({ data: { results: { signatureSetup: { ...SAVED_SETUP, fields: [] } } } });

      const result = await TurboSign.removeTemplateSignatureAnchor(TEMPLATE_ID, "f/1");

      const [url, init] = fetch.mock.calls[0];
      expect(url).toContain(`/turbosign/templates/${TEMPLATE_ID}/signature-setup/anchors/f%2F1`);
      expect(init.method).toBe("DELETE");
      expect(result.signatureSetup.fields).toEqual([]);
    });

    it("surfaces an unknown field id as NotFoundError", async () => {
      mockFetch({ message: "No anchored field with this id in the signature setup", code: "SetupFieldNotFound" }, 404);

      await expect(TurboSign.removeTemplateSignatureAnchor(TEMPLATE_ID, "nope")).rejects.toMatchObject({
        constructor: NotFoundError,
        code: "SetupFieldNotFound",
      });
    });
  });
});
