/**
 * With `fitAnchoredTags` absent, every request is exactly what it was before the flag existed:
 * the same URL, method and body, key for key and in the same order, on both send paths (multipart
 * and JSON) and on createEmbeddedSignature, whose `fields` shorthand keeps its default size. These
 * expectations pass unchanged against the code from before the flag was added.
 */
import { TurboSign } from "../src/modules/sign";

const pdf = Buffer.from("%PDF-1.4 fake pdf bytes");
const recipients = [{ name: "Jane Doe", email: "jane@example.com", signingOrder: 1 }];
const fields = [
  { type: "signature" as const, recipientEmail: "jane@example.com", template: { anchor: "{ClientSign}" } },
];
const recipientsJson = '[{"name":"Jane Doe","email":"jane@example.com","signingOrder":1}]';
const fieldsJson = '[{"type":"signature","recipientEmail":"jane@example.com","template":{"anchor":"{ClientSign}"}}]';

const ok = (data: unknown): unknown => ({
  ok: true,
  status: 200,
  statusText: "OK",
  headers: { get: (): string => "application/json" },
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(""),
});

const sent = {
  data: {
    success: true,
    documentId: "doc-1",
    status: "under_review",
    recipients: [{ id: "rec-1", name: "Jane Doe", email: "jane@example.com" }],
    message: "ok",
  },
};

function mockFetch(): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue(ok(sent));
  (globalThis as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  return fetchMock;
}

/** The multipart form of the first call, in order, as [key, value] pairs (a file part by its name). */
function formEntries(fetchMock: jest.Mock): [string, string][] {
  const formData = fetchMock.mock.calls[0][1].body as FormData;
  return [...formData.entries()].map(([key, value]) => [
    key,
    typeof value === "string" ? value : value.name,
  ]);
}

describe("TurboSign requests with fitAnchoredTags absent", () => {
  beforeEach(() => {
    TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
  });

  const paths = {
    sendSignature: "/turbosign/single/prepare-for-signing",
    createSignatureReviewLink: "/turbosign/single/prepare-for-review",
  };
  const send = async (name: keyof typeof paths, request: Record<string, unknown>): Promise<void> => {
    await (name === "sendSignature"
      ? TurboSign.sendSignature(request as never)
      : TurboSign.createSignatureReviewLink(request as never));
  };

  // Every other option, so the order of all the keys around the flag is pinned too.
  const options = {
    documentName: "Contract",
    documentDescription: "Please sign",
    senderName: "Acme",
    ccEmails: ["cc@example.com"],
    sendEmail: false,
    remindersEnabled: true,
    reminderDelay: { value: 2, unit: "days" },
  };
  // sendEmail is a send option: the review link has never forwarded it.
  const expected = (name: keyof typeof paths): [string, string | boolean][] => [
    ["recipients", recipientsJson],
    ["fields", fieldsJson],
    ["documentName", "Contract"],
    ["documentDescription", "Please sign"],
    ["senderEmail", "test@company.com"],
    ["senderName", "Acme"],
    ["ccEmails", '["cc@example.com"]'],
    ...(name === "sendSignature" ? [["sendEmail", false] as [string, boolean]] : []),
    ["remindersEnabled", true],
    ["reminderDelay", '{"value":2,"unit":"days"}'],
  ];

  describe.each(Object.keys(paths) as (keyof typeof paths)[])("%s", (name) => {
    it("sends the same multipart form", async () => {
      const fetchMock = mockFetch();
      await send(name, { file: pdf, recipients, fields, ...options });

      expect(fetchMock.mock.calls[0][0]).toBe(`https://api.turbodocx.com${paths[name]}`);
      expect(fetchMock.mock.calls[0][1].method).toBe("POST");
      expect(formEntries(fetchMock)).toStrictEqual([
        ["file", "document.pdf"],
        ...expected(name).map(([key, value]): [string, string] => [key, String(value)]),
      ]);
    });

    it("sends the same JSON body", async () => {
      const fetchMock = mockFetch();
      await send(name, { fileLink: "https://example.com/c.pdf", recipients, fields, ...options });

      expect(fetchMock.mock.calls[0][0]).toBe(`https://api.turbodocx.com${paths[name]}`);
      expect(fetchMock.mock.calls[0][1].method).toBe("POST");
      const body = Object.fromEntries([...expected(name), ["fileLink", "https://example.com/c.pdf"]]);
      expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify(body));
    });
  });

  it("createEmbeddedSignature sends the same body, with the shorthand's default size", async () => {
    const fetchMock = mockFetch()
      .mockResolvedValueOnce(ok(sent))
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
      fileLink: "https://example.com/c.pdf",
      recipients: [
        { name: "Jane Doe", email: "jane@example.com", fields: { signature: "{ClientSign}", date: "{Date}" } },
      ],
    });

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.turbodocx.com/turbosign/single/prepare-for-signing");
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({
        recipients: recipientsJson,
        fields:
          '[{"type":"signature","recipientEmail":"jane@example.com",' +
          '"template":{"anchor":"{ClientSign}","placement":"replace","size":{"width":100,"height":30}}},' +
          '{"type":"date","recipientEmail":"jane@example.com",' +
          '"template":{"anchor":"{Date}","placement":"replace","size":{"width":75,"height":30}}}]',
        senderEmail: "test@company.com",
        sendEmail: false,
        fileLink: "https://example.com/c.pdf",
      }),
    );
  });
});
