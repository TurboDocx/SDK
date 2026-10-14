/**
 * `fileName` on an upload travels as a `fileName` form field (the API stores it as the document's
 * file name). The uploaded part keeps a safe name, because the API checks its extension.
 * Real HttpClient, mocked fetch, so the FormData is inspected.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { TurboSign } from "../src/modules/sign";

const pdf = Buffer.from("%PDF-1.4 fake pdf bytes");
const ok = (data: unknown) => ({ ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" }, json: async () => data });

function mockFetch(): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue(ok({ data: { success: true, documentId: "doc-1", status: "under_review", recipients: [], message: "ok" } }));
  (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
  return fetchMock;
}

function sentForm(fetchMock: jest.Mock): { partName: string; fileNameField: unknown } {
  const formData = fetchMock.mock.calls[0][1].body as FormData;
  return { partName: (formData.get("file") as File).name, fileNameField: formData.get("fileName") };
}

describe("TurboSign file uploads forward fileName", () => {
  beforeEach(() => {
    TurboSign.configure({ apiKey: "k", orgId: "o", senderEmail: "test@company.com" });
  });

  it("sendSignature sends fileName as a form field and keeps the part named document.<ext>", async () => {
    const fetchMock = mockFetch();
    await TurboSign.sendSignature({ recipients: [], fields: [], file: pdf, fileName: "Lease-Agreement-2026.pdf" });
    expect(sentForm(fetchMock)).toEqual({ partName: "document.pdf", fileNameField: "Lease-Agreement-2026.pdf" });
  });

  it("a fileName without an extension still uploads a valid document.pdf part", async () => {
    const fetchMock = mockFetch();
    await TurboSign.sendSignature({ recipients: [], fields: [], file: pdf, fileName: "Lease Agreement 2026" });
    expect(sentForm(fetchMock)).toEqual({ partName: "document.pdf", fileNameField: "Lease Agreement 2026" });
  });

  it("sendSignature without fileName sends no fileName field", async () => {
    const fetchMock = mockFetch();
    await TurboSign.sendSignature({ recipients: [], fields: [], file: pdf });
    expect(sentForm(fetchMock)).toEqual({ partName: "document.pdf", fileNameField: null });
  });

  it("an empty fileName sends no field (the API rejects an empty one)", async () => {
    const fetchMock = mockFetch();
    await TurboSign.sendSignature({ recipients: [], fields: [], file: pdf, fileName: "" });
    expect(sentForm(fetchMock)).toEqual({ partName: "document.pdf", fileNameField: null });
  });

  it("a file path keeps its basename as the part and still forwards fileName", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "filename-test-"));
    const filePath = path.join(dir, "scan_0001.pdf");
    fs.writeFileSync(filePath, pdf);
    const fetchMock = mockFetch();
    await TurboSign.sendSignature({ recipients: [], fields: [], file: filePath, fileName: "Lease-2026.pdf" });
    expect(sentForm(fetchMock)).toEqual({ partName: "scan_0001.pdf", fileNameField: "Lease-2026.pdf" });
  });

  it("a browser File keeps its own name as the part and still forwards fileName", async () => {
    const fetchMock = mockFetch();
    const file = new File([pdf], "upload.pdf", { type: "application/pdf" });
    await TurboSign.sendSignature({ recipients: [], fields: [], file, fileName: "Lease-2026.pdf" });
    expect(sentForm(fetchMock)).toEqual({ partName: "upload.pdf", fileNameField: "Lease-2026.pdf" });
  });

  it("createSignatureReviewLink forwards fileName", async () => {
    const fetchMock = mockFetch();
    await TurboSign.createSignatureReviewLink({ recipients: [], fields: [], file: pdf, fileName: "Review-Copy.pdf" });
    expect(sentForm(fetchMock).fileNameField).toBe("Review-Copy.pdf");
  });

  it("createEmbeddedSignature forwards fileName to the upload", async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(ok({ data: { success: true, documentId: "doc-1", status: "under_review", recipients: [{ id: "rec-1", name: "Jane Doe", email: "jane@example.com" }], message: "ok" } }))
      .mockResolvedValueOnce(ok({ data: { results: { url: "https://app.example.com/e", expiresAt: null, recipientId: "rec-1", identityVerificationMode: null, pendingChecks: [] } } }));
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    await TurboSign.createEmbeddedSignature({
      file: pdf,
      fileName: "Embedded-Contract.pdf",
      recipients: [{ name: "Jane Doe", email: "jane@example.com", fields: { signature: "{signature1}" } }],
    });
    expect(sentForm(fetchMock).fileNameField).toBe("Embedded-Contract.pdf");
  });

  it("the fileLink path does not send fileName", async () => {
    const fetchMock = mockFetch();
    await TurboSign.sendSignature({ recipients: [], fields: [], fileLink: "https://example.com/a.pdf", fileName: "Ignored.pdf" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).not.toHaveProperty("fileName");
  });
});
