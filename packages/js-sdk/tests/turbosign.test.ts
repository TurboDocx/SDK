/**
 * TurboSign Module Tests
 *
 * Tests for SDK operations:
 * - createSignatureReviewLink
 * - sendSignature
 * - getStatus
 * - download
 * - void
 * - resend
 * - getAuditTrail
 */

import { TurboSign } from "../src/modules/sign";
import { HttpClient } from "../src/http";
import type { N8nRecipient, N8nField } from "../src/types/sign";

// Mock the HttpClient
jest.mock("../src/http");

// Mock global fetch for download tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe("TurboSign Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static client
    (TurboSign as any).client = undefined;
  });

  describe("configure", () => {
    it("should configure the client with API key", () => {
      TurboSign.configure({ apiKey: "test-api-key" });
      expect(MockedHttpClient).toHaveBeenCalledWith({ apiKey: "test-api-key" });
    });

    it("should configure with custom base URL", () => {
      TurboSign.configure({
        apiKey: "test-api-key",
        baseUrl: "https://custom-api.example.com",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        baseUrl: "https://custom-api.example.com",
      });
    });

    it("should configure with org ID", () => {
      TurboSign.configure({
        apiKey: "test-api-key",
        orgId: "org-123",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        orgId: "org-123",
      });
    });
  });

  describe("createSignatureReviewLink", () => {
    const mockFile = Buffer.from("mock-pdf-content");
    const mockRecipients: N8nRecipient[] = [
      { name: "John Doe", email: "john@example.com", signingOrder: 1 },
    ];
    const mockFields: N8nField[] = [
      {
        type: "signature",
        page: 1,
        x: 100,
        y: 500,
        width: 200,
        height: 50,
        recipientEmail: "john@example.com",
      },
    ];

    it("should prepare document for review with file upload", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-123",
        status: "review_ready",
        previewUrl: "https://preview.example.com/doc-123",
        recipients: [
          {
            id: "rec-1",
            name: "John Doe",
            email: "john@example.com",
            status: "pending",
          },
        ],
        message: "Document prepared for review",
      };

      MockedHttpClient.prototype.uploadFile = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.createSignatureReviewLink({
        file: mockFile,
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(result.success).toBe(true);
      expect(result.documentId).toBe("doc-123");
      expect(result.status).toBe("review_ready");
      expect(result.previewUrl).toBeDefined();
    });

    it("should prepare document for review with file URL", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-456",
        status: "review_ready",
        previewUrl: "https://preview.example.com/doc-456",
        message: "Document prepared for review",
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.createSignatureReviewLink({
        fileLink: "https://storage.example.com/contract.pdf",
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(result.documentId).toBe("doc-456");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/single/prepare-for-review",
        expect.objectContaining({
          fileLink: "https://storage.example.com/contract.pdf",
          recipients: expect.any(String),
          fields: expect.any(String),
        })
      );
    });

    it("should prepare document for review with deliverable ID", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-789",
        status: "review_ready",
        message: "Document prepared for review",
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.createSignatureReviewLink({
        deliverableId: "deliverable-abc",
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(result.documentId).toBe("doc-789");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/single/prepare-for-review",
        expect.objectContaining({
          deliverableId: "deliverable-abc",
        })
      );
    });

    it("should prepare document for review with template ID", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-template",
        status: "review_ready",
        message: "Document prepared for review",
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.createSignatureReviewLink({
        templateId: "template-xyz",
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(result.documentId).toBe("doc-template");
    });

    it("should include optional fields in request", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-123",
        status: "review_ready",
        message: "Document prepared for review",
      };
      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      await TurboSign.createSignatureReviewLink({
        fileLink: "https://example.com/doc.pdf",
        recipients: mockRecipients,
        fields: mockFields,
        documentName: "Test Contract",
        documentDescription: "A test contract",
        senderName: "Sales Team",
        senderEmail: "sales@company.com",
        ccEmails: ["admin@company.com", "legal@company.com"],
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/single/prepare-for-review",
        expect.objectContaining({
          documentName: "Test Contract",
          documentDescription: "A test contract",
          senderName: "Sales Team",
          senderEmail: "sales@company.com",
          ccEmails: expect.any(String),
        })
      );
    });

    it("should support template anchor-based field positioning", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-anchor",
        status: "review_ready",
        message: "Document prepared for review",
      };

      const fieldsWithAnchor: N8nField[] = [
        {
          type: "signature",
          recipientEmail: "john@example.com",
          template: {
            anchor: "{SignHere}",
            placement: "replace",
            size: { width: 200, height: 50 },
          },
        },
      ];

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.createSignatureReviewLink({
        templateId: "template-with-anchors",
        recipients: mockRecipients,
        fields: fieldsWithAnchor,
      });

      expect(result.documentId).toBe("doc-anchor");
    });
  });

  describe("sendSignature", () => {
    const mockRecipients: N8nRecipient[] = [
      { name: "John Doe", email: "john@example.com", signingOrder: 1 },
    ];
    const mockFields: N8nField[] = [
      {
        type: "signature",
        page: 1,
        x: 100,
        y: 500,
        width: 200,
        height: 50,
        recipientEmail: "john@example.com",
      },
    ];

    it("should prepare document for signing and send emails", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-123",
        message: "Document sent for signing",
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.sendSignature({
        fileLink: "https://storage.example.com/contract.pdf",
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(result.success).toBe(true);
      expect(result.documentId).toBe("doc-123");
      expect(result.message).toContain("signing");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/single/prepare-for-signing",
        expect.any(Object)
      );
    });

    it("should handle file upload for signing", async () => {
      const mockFile = Buffer.from("mock-pdf-content");
      const mockResponse = {
        success: true,
        documentId: "doc-upload",
        message: "Document sent for signing",
      };

      MockedHttpClient.prototype.uploadFile = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.sendSignature({
        file: mockFile,
        fileName: "contract.pdf",
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(result.documentId).toBe("doc-upload");
    });

    it("should support checkbox fields with default values", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-checkbox",
        message: "Document sent for signing",
      };

      const fieldsWithCheckbox: N8nField[] = [
        {
          type: "signature",
          page: 1,
          x: 100,
          y: 500,
          width: 200,
          height: 50,
          recipientEmail: "john@example.com",
        },
        {
          type: "checkbox",
          page: 1,
          x: 100,
          y: 600,
          width: 20,
          height: 20,
          recipientEmail: "john@example.com",
          defaultValue: "true",
        },
      ];

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.sendSignature({
        fileLink: "https://example.com/doc.pdf",
        recipients: mockRecipients,
        fields: fieldsWithCheckbox,
      });

      expect(result.documentId).toBe("doc-checkbox");
    });
  });

  describe("getStatus", () => {
    it("should get document status", async () => {
      const mockResponse = {
        data: {
          documentId: "doc-123",
          status: "under_review",
          name: "Test Document",
          recipients: [
            {
              id: "rec-1",
              name: "John Doe",
              email: "john@example.com",
              status: "pending",
            },
          ],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getStatus("doc-123");

      expect(result.documentId).toBe("doc-123");
      expect(result.status).toBe("under_review");
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/status"
      );
    });
  });

  describe("download", () => {
    it("should download signed document as Blob", async () => {
      const mockPresignedResponse = {
        downloadUrl: "https://s3.example.com/presigned-url",
        fileName: "signed-document.pdf",
      };

      const mockPdfContent = new ArrayBuffer(4);
      const mockFetchResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockPdfContent),
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockPresignedResponse);
      mockFetch.mockResolvedValue(mockFetchResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.download("doc-123");

      expect(result).toBeInstanceOf(Blob);
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/download"
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://s3.example.com/presigned-url"
      );
    });

    it("should throw error if S3 download fails", async () => {
      const mockPresignedResponse = {
        downloadUrl: "https://s3.example.com/presigned-url",
        fileName: "signed-document.pdf",
      };

      const mockFetchResponse = {
        ok: false,
        statusText: "Forbidden",
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockPresignedResponse);
      mockFetch.mockResolvedValue(mockFetchResponse);
      TurboSign.configure({ apiKey: "test-key" });

      await expect(TurboSign.download("doc-123")).rejects.toThrow(
        "Failed to download file"
      );
    });
  });

  describe("void", () => {
    it("should void a document with reason", async () => {
      const mockResponse = {
        data: {
          documentId: "doc-123",
          status: "voided",
          voidedAt: "2024-01-01T12:00:00Z",
        },
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.void("doc-123", "Document needs revision");

      expect(result.documentId).toBe("doc-123");
      expect(result.status).toBe("voided");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/void",
        { reason: "Document needs revision" }
      );
    });
  });

  describe("resend", () => {
    it("should resend email to specific recipients", async () => {
      const mockResponse = {
        data: {
          documentId: "doc-123",
          message: "Emails resent successfully",
          resentAt: "2024-01-01T12:00:00Z",
        },
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.resend("doc-123", ["rec-1", "rec-2"]);

      expect(result.message).toContain("resent");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/resend-email",
        { recipientIds: ["rec-1", "rec-2"] }
      );
    });

    it("should resend email to all recipients when empty array", async () => {
      const mockResponse = {
        data: {
          documentId: "doc-123",
          message: "Emails resent to all recipients",
          resentAt: "2024-01-01T12:00:00Z",
        },
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.resend("doc-123", []);

      expect(result.message).toContain("resent");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/resend-email",
        { recipientIds: [] }
      );
    });
  });

  describe("getAuditTrail", () => {
    it("should get audit trail for a document", async () => {
      const mockResponse = {
        data: {
          documentId: "doc-123",
          entries: [
            {
              event: "document_created",
              actor: "sender@example.com",
              timestamp: "2024-01-01T10:00:00Z",
              ipAddress: "192.168.1.1",
            },
            {
              event: "email_sent",
              actor: "system",
              timestamp: "2024-01-01T10:01:00Z",
              details: { recipientEmail: "john@example.com" },
            },
            {
              event: "document_viewed",
              actor: "john@example.com",
              timestamp: "2024-01-01T11:00:00Z",
              ipAddress: "10.0.0.1",
            },
            {
              event: "document_signed",
              actor: "john@example.com",
              timestamp: "2024-01-01T11:05:00Z",
              ipAddress: "10.0.0.1",
            },
          ],
        },
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getAuditTrail("doc-123");

      expect(result.documentId).toBe("doc-123");
      expect(result.entries).toHaveLength(4);
      expect(result.entries[0].event).toBe("document_created");
      expect(result.entries[3].event).toBe("document_signed");
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/audit-trail"
      );
    });

    it("should return empty entries for new document", async () => {
      const mockResponse = {
        data: {
          documentId: "doc-new",
          entries: [],
        },
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getAuditTrail("doc-new");

      expect(result.documentId).toBe("doc-new");
      expect(result.entries).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should throw error when API key is not configured", async () => {
      // Don't configure, let it auto-initialize without API key
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockRejectedValue(new Error("API key is required"));

      await expect(TurboSign.getStatus("doc-123")).rejects.toThrow();
    });

    it("should handle API errors gracefully", async () => {
      const apiError = {
        statusCode: 404,
        message: "Document not found",
        code: "DOCUMENT_NOT_FOUND",
      };

      MockedHttpClient.prototype.get = jest.fn().mockRejectedValue(apiError);
      TurboSign.configure({ apiKey: "test-key" });

      await expect(TurboSign.getStatus("invalid-doc")).rejects.toEqual(
        apiError
      );
    });

    it("should handle validation errors", async () => {
      const validationError = {
        statusCode: 400,
        message: "Validation failed",
        errors: [
          { path: ["recipients", 0, "email"], message: "Invalid email format" },
        ],
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockRejectedValue(validationError);
      TurboSign.configure({ apiKey: "test-key" });

      await expect(
        TurboSign.sendSignature({
          fileLink: "https://example.com/doc.pdf",
          recipients: [
            { name: "Test", email: "invalid-email", signingOrder: 1 },
          ],
          fields: [],
        })
      ).rejects.toEqual(validationError);
    });

    it("should handle rate limit errors", async () => {
      const rateLimitError = {
        statusCode: 429,
        message: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockRejectedValue(rateLimitError);
      TurboSign.configure({ apiKey: "test-key" });

      await expect(
        TurboSign.createSignatureReviewLink({
          fileLink: "https://example.com/doc.pdf",
          recipients: [
            { name: "Test", email: "test@example.com", signingOrder: 1 },
          ],
          fields: [],
        })
      ).rejects.toEqual(rateLimitError);
    });
  });
});
