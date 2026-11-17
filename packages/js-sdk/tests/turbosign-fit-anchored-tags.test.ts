/**
 * `fitAnchoredTags` on the two send paths (and the embedded wrapper over sendSignature). It is sent
 * only when it is boolean `true` or the string "true" (any case): the API treats `false` the same as
 * a missing key, so leaving everything else out keeps every existing request body exactly as it was.
 * Real HttpClient, mocked fetch.
 */
import { TurboSign } from "../src/modules/sign";

const pdf = Buffer.from("%PDF-1.4 fake pdf bytes");
const recipients = [{ name: "Jane Doe", email: "jane@example.com", signingOrder: 1 }];
const fields = [
  { type: "signature" as const, recipientEmail: "jane@example.com", template: { anchor: "{ClientSign}" } },
];

interface MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get: () => string };
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

const ok = (data: unknown): MockResponse => ({
  ok: true,
  status: 200,
  statusText: "OK",
  headers: { get: (): string => "application/json" },
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(""),
});

function mockFetch(): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue(
    ok({
      data: {
        success: true,
        documentId: "doc-1",
        status: "under_review",
        recipients: [{ id: "rec-1", name: "Jane Doe", email: "jane@example.com" }],
        message: "ok",
      },
    }),
  );
  (globalThis as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  return fetchMock;
}

/** The multipart form of the first call, as [key, value] pairs (a file part by its name). */
function formEntries(fetchMock: jest.Mock): [string, string][] {
  const formData = fetchMock.mock.calls[0][1].body as FormData;
  return [...formData.entries()].map(([key, value]) => [
    key,
    typeof value === "string" ? value : value.name,
  ]);
}

/** The JSON body of the first call. */
function jsonBody(fetchMock: jest.Mock): Record<string, unknown> {
  return JSON.parse(fetchMock.mock.calls[0][1].body as string);
}

/** Values a plain-JS caller may pass that turn the flag on (sent as boolean `true`). */
const onValues: unknown[] = [true, "true", "TRUE", "True"];
/** Values that leave the key out, exactly as if it were unset. */
const offValues: unknown[] = [false, "false", "FALSE", 1, 0, "1", "yes", "", null];

type Send = (request: Record<string, unknown>) => Promise<void>;
const sends: [string, Send, string][] = [
  [
    "sendSignature",
    async (r) => {
      await TurboSign.sendSignature(r as never);
    },
    "/turbosign/single/prepare-for-signing",
  ],
  [
    "createSignatureReviewLink",
    async (r) => {
      await TurboSign.createSignatureReviewLink(r as never);
    },
    "/turbosign/single/prepare-for-review",
  ],
];

describe("TurboSign fitAnchoredTags", () => {
  beforeEach(() => {
    TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
  });

  describe.each(sends)("%s", (_name, send, path) => {
    describe("with a file upload (multipart)", () => {
      const sendWith = async (extra: Record<string, unknown>): Promise<[string, string][]> => {
        const fetchMock = mockFetch();
        await send({ file: pdf, recipients, fields, ...extra });
        expect(fetchMock.mock.calls[0][0]).toContain(path);
        return formEntries(fetchMock);
      };

      it("sends fitAnchoredTags=true when it is true", async () => {
        const form = await sendWith({ fitAnchoredTags: true });
        expect(form).toContainEqual(["fitAnchoredTags", "true"]);
      });

      it("leaves the key out when it is false or unset, and the form is otherwise unchanged", async () => {
        const unset = await sendWith({});
        const off = await sendWith({ fitAnchoredTags: false });
        const on = await sendWith({ fitAnchoredTags: true });

        expect(unset.map(([key]) => key)).not.toContain("fitAnchoredTags");
        expect(off).toStrictEqual(unset);
        expect(on.filter(([key]) => key !== "fitAnchoredTags")).toStrictEqual(unset);
      });

      it.each(onValues)("sends fitAnchoredTags=true for %p", async (value) => {
        const form = await sendWith({ fitAnchoredTags: value });
        expect(form).toContainEqual(["fitAnchoredTags", "true"]);
      });

      it.each(offValues)("leaves the key out for %p", async (value) => {
        const unset = await sendWith({});
        await expect(sendWith({ fitAnchoredTags: value })).resolves.toStrictEqual(unset);
      });
    });

    describe("with a file link (JSON)", () => {
      const sendWith = async (extra: Record<string, unknown>): Promise<Record<string, unknown>> => {
        const fetchMock = mockFetch();
        await send({ fileLink: "https://example.com/contract.pdf", recipients, fields, ...extra });
        expect(fetchMock.mock.calls[0][0]).toContain(path);
        return jsonBody(fetchMock);
      };

      it("sends fitAnchoredTags: true when it is true", async () => {
        const body = await sendWith({ fitAnchoredTags: true });
        expect(body.fitAnchoredTags).toBe(true);
      });

      it("leaves the key out when it is false or unset, and the body is otherwise unchanged", async () => {
        const unset = await sendWith({});
        const off = await sendWith({ fitAnchoredTags: false });
        const { fitAnchoredTags, ...rest } = await sendWith({ fitAnchoredTags: true });

        expect(unset).not.toHaveProperty("fitAnchoredTags");
        expect(off).toStrictEqual(unset);
        expect(fitAnchoredTags).toBe(true);
        expect(rest).toStrictEqual(unset);
      });

      it.each(onValues)("sends fitAnchoredTags: true (a boolean) for %p", async (value) => {
        const body = await sendWith({ fitAnchoredTags: value });
        expect(body.fitAnchoredTags).toBe(true);
      });

      it.each(offValues)("leaves the key out for %p", async (value) => {
        const unset = await sendWith({});
        await expect(sendWith({ fitAnchoredTags: value })).resolves.toStrictEqual(unset);
      });
    });
  });

  describe("createEmbeddedSignature", () => {
    const embedWith = async (extra: Record<string, unknown>): Promise<Record<string, unknown>> => {
      const fetchMock = mockFetch()
        .mockResolvedValueOnce(
          ok({
            data: {
              success: true,
              documentId: "doc-1",
              status: "under_review",
              recipients: [{ id: "rec-1", name: "Jane Doe", email: "jane@example.com" }],
              message: "ok",
            },
          }),
        )
        .mockResolvedValueOnce(
          ok({
            data: {
              results: {
                url: "https://app/sign/doc-1?token=T",
                expiresAt: null,
                recipientId: "rec-1",
                identityVerificationMode: null,
                pendingChecks: [],
              },
            },
          }),
        );
      await TurboSign.createEmbeddedSignature({
        fileLink: "https://example.com/contract.pdf",
        recipients: [{ name: "Jane Doe", email: "jane@example.com", fields: { signature: "{ClientSign}" } }],
        ...extra,
      });
      expect(fetchMock.mock.calls[0][0]).toContain("/turbosign/single/prepare-for-signing");
      return jsonBody(fetchMock);
    };

    it("passes fitAnchoredTags: true through to the send", async () => {
      const body = await embedWith({ fitAnchoredTags: true });
      expect(body.fitAnchoredTags).toBe(true);
    });

    it("leaves the key out when it is false or unset", async () => {
      const unset = await embedWith({});
      const off = await embedWith({ fitAnchoredTags: false });

      expect(unset).not.toHaveProperty("fitAnchoredTags");
      expect(off).toStrictEqual(unset);
    });

    it.each(onValues)("passes %p through as fitAnchoredTags: true", async (value) => {
      const body = await embedWith({ fitAnchoredTags: value });
      expect(body.fitAnchoredTags).toBe(true);
    });

    it.each(offValues)("leaves the key out for %p", async (value) => {
      const unset = await embedWith({});
      await expect(embedWith({ fitAnchoredTags: value })).resolves.toStrictEqual(unset);
    });

    /** The `template` of each field sent, parsed from the body's JSON-string `fields`. */
    const sentTemplates = (body: Record<string, unknown>): Record<string, unknown>[] =>
      (JSON.parse(body.fields as string) as { template: Record<string, unknown> }[]).map((f) => f.template);

    it.each(onValues)("leaves the default size off shorthand fields when it is %p, so they are fitted", async (value) => {
      const [template] = sentTemplates(await embedWith({ fitAnchoredTags: value }));
      expect(template).toStrictEqual({ anchor: "{ClientSign}", placement: "replace" });
    });

    it.each([undefined, ...offValues])("keeps the default size on shorthand fields when it is %p", async (value) => {
      const [template] = sentTemplates(await embedWith({ fitAnchoredTags: value }));
      expect(template).toStrictEqual({
        anchor: "{ClientSign}",
        placement: "replace",
        size: { width: 100, height: 30 },
      });
    });

    it("keeps a size the caller gave on top-level fields", async () => {
      const sized = [
        {
          type: "signature",
          recipientEmail: "jane@example.com",
          template: { anchor: "{ClientSign}", size: { width: 120, height: 40 } },
        },
      ];
      const [template] = sentTemplates(await embedWith({ fitAnchoredTags: true, fields: sized }));
      expect(template).toStrictEqual({ anchor: "{ClientSign}", size: { width: 120, height: 40 } });
    });
  });
});
