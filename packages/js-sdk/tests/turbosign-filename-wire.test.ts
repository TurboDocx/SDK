/**
 * `fileName` on a Buffer upload must reach the API as the multipart file part's filename (the API
 * stores it as the document's file name). Real HttpClient, mocked fetch, so the FormData is inspected.
 */
import { TurboSign } from "../src/modules/sign";

const pdf = Buffer.from("%PDF-1.4 fake pdf bytes");

function mockFetch(): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" },
    json: async () => ({ data: { success: true, documentId: "doc-1", status: "under_review", recipients: [], message: "ok" } }),
  });
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  return fetchMock;
}

function uploadedFile(fetchMock: jest.Mock): { name: string; formData: FormData } {
  const formData = fetchMock.mock.calls[0][1].body as FormData;
  return { name: (formData.get("file") as File).name, formData };
}

describe("TurboSign file uploads forward fileName", () => {
  beforeEach(() => {
    TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
  });

  it("sendSignature names the uploaded part with fileName, not as a form field", async () => {
    const fetchMock = mockFetch();
    await TurboSign.sendSignature({ recipients: [], fields: [], file: pdf, fileName: "Lease-Agreement-2026.pdf" });
    const { name, formData } = uploadedFile(fetchMock);
    expect(name).toBe("Lease-Agreement-2026.pdf");
    expect(formData.has("fileName")).toBe(false);
  });

  it("sendSignature falls back to document.<ext> without fileName", async () => {
    const fetchMock = mockFetch();
    await TurboSign.sendSignature({ recipients: [], fields: [], file: pdf });
    expect(uploadedFile(fetchMock).name).toBe("document.pdf");
  });

  it("createSignatureReviewLink names the uploaded part with fileName", async () => {
    const fetchMock = mockFetch();
    await TurboSign.createSignatureReviewLink({ recipients: [], fields: [], file: pdf, fileName: "Review-Copy.pdf" });
    expect(uploadedFile(fetchMock).name).toBe("Review-Copy.pdf");
  });

  it("createEmbeddedSignature forwards fileName to the upload", async () => {
    const ok = (data: unknown) => ({ ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" }, json: async () => data });
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(ok({ data: { success: true, documentId: "doc-1", status: "under_review", recipients: [{ id: "rec-1", name: "Jane Doe", email: "jane@example.com" }], message: "ok" } }))
      .mockResolvedValueOnce(ok({ data: { results: { url: "https://app.example.com/e", expiresAt: null, recipientId: "rec-1", identityVerificationMode: null, pendingChecks: [] } } }));
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    await TurboSign.createEmbeddedSignature({
      file: pdf,
      fileName: "Embedded-Contract.pdf",
      recipients: [{ name: "Jane Doe", email: "jane@example.com", fields: { signature: "{signature1}" } }],
    });
    expect(uploadedFile(fetchMock).name).toBe("Embedded-Contract.pdf");
  });
});
