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
import { NetworkError, NotFoundError } from "../src/utils/errors";
import type { Recipient, Field } from "../src/types/sign";

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

    // Mock getSenderConfig to return default values
    MockedHttpClient.prototype.getSenderConfig = jest.fn().mockReturnValue({
      senderEmail: "test@company.com",
      senderName: "Test Company"
    });
  });

  describe("configure", () => {
    it("should configure the client with API key", () => {
      TurboSign.configure({
        apiKey: "test-api-key",
        orgId: "test-org-id",
        senderEmail: "test@company.com"
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        orgId: "test-org-id",
        senderEmail: "test@company.com"
      });
    });

    it("should configure with custom base URL", () => {
      TurboSign.configure({
        apiKey: "test-api-key",
        orgId: "test-org-id",
        senderEmail: "test@company.com",
        baseUrl: "https://custom-api.example.com",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        orgId: "test-org-id",
        senderEmail: "test@company.com",
        baseUrl: "https://custom-api.example.com",
      });
    });

    it("should configure with org ID", () => {
      TurboSign.configure({
        apiKey: "test-api-key",
        orgId: "org-123",
        senderEmail: "test@company.com"
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        orgId: "org-123",
        senderEmail: "test@company.com"
      });
    });
  });

  describe("createSignatureReviewLink", () => {
    const mockFile = Buffer.from("mock-pdf-content");
    const mockRecipients: Recipient[] = [
      { name: "John Doe", email: "john@example.com", signingOrder: 1 },
    ];
    const mockFields: Field[] = [
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

      const fieldsWithAnchor: Field[] = [
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
    const mockRecipients: Recipient[] = [
      { name: "John Doe", email: "john@example.com", signingOrder: 1 },
    ];
    const mockFields: Field[] = [
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
        status: "UNDER_REVIEW",
        recipients: [
          { id: "r-1", name: "John Doe", email: "john@example.com", metadata: { color: "hsl(200, 75%, 50%)" } },
        ],
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
      expect(result.status).toBe("UNDER_REVIEW");
      expect(result.recipients).toHaveLength(1);
      expect(result.recipients![0].email).toBe("john@example.com");
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
        status: "UNDER_REVIEW",
        recipients: [
          { id: "r-1", name: "John Doe", email: "john@example.com", metadata: {} },
        ],
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
        status: "UNDER_REVIEW",
        recipients: [
          { id: "r-1", name: "John Doe", email: "john@example.com", metadata: {} },
        ],
        message: "Document sent for signing",
      };

      const fieldsWithCheckbox: Field[] = [
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

    it("should serialize conditional (IF/THEN) field metadata into the fields request part", async () => {
      const mockResponse = {
        success: true,
        documentId: "doc-conditional",
        status: "UNDER_REVIEW",
        recipients: [
          { id: "r-1", name: "John Doe", email: "john@example.com", metadata: {} },
        ],
        message: "Document sent for signing",
      };

      // Controlling checkbox carries metadata.fieldKey; dependent field references it.
      const conditionalFields: Field[] = [
        {
          type: "checkbox",
          page: 1,
          x: 100,
          y: 600,
          width: 20,
          height: 20,
          recipientEmail: "john@example.com",
          metadata: { fieldKey: "request_changes" },
        },
        {
          type: "text",
          page: 1,
          x: 100,
          y: 650,
          width: 200,
          height: 50,
          recipientEmail: "john@example.com",
          metadata: {
            conditional: {
              controllingFieldKey: "request_changes",
              operator: "is_checked",
              action: "show",
            },
          },
        },
      ];

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      await TurboSign.sendSignature({
        fileLink: "https://example.com/doc.pdf",
        recipients: mockRecipients,
        fields: conditionalFields,
      });

      // fields is JSON-stringified wholesale into the request body — metadata must ride along.
      const [, formData] = (MockedHttpClient.prototype.post as jest.Mock).mock
        .calls[0];
      const sentFields = JSON.parse(formData.fields);

      expect(sentFields[0].metadata).toEqual({ fieldKey: "request_changes" });
      expect(sentFields[1].metadata.conditional).toEqual({
        controllingFieldKey: "request_changes",
        operator: "is_checked",
        action: "show",
      });
    });
  });

  describe("getStatus", () => {
    it("should get document status", async () => {
      // HTTP client auto-unwraps {data: ...} responses
      const mockResponse = {
        status: "under_review",
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getStatus("doc-123");

      expect(result.status).toBe("under_review");
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/status"
      );
    });
  });

  describe("getRecipients", () => {
    // The wire shape after the HTTP client unwraps {data: ...}
    const mockRecipientsResponse = {
      document: {
        id: "doc-123",
        name: "Mutual NDA",
        status: "under_review",
        createdOn: "2026-01-01T00:00:00.000Z",
        sentOn: "2026-01-02T08:59:00.000Z",
        expiresAt: null,
        sentBy: { name: "Jane Sender", email: "jane@acme.com" },
      },
      recipients: [
        {
          id: "rec-1",
          name: "John Signer",
          email: "john@example.com",
          status: "completed",
          effectiveStatus: "completed",
          signedOn: "2026-02-01T10:00:00.000Z",
          signingOrder: 1,
          delivery: {
            firstSentOn: "2026-01-02T09:00:00.000Z",
            lastSentOn: "2026-01-09T09:00:00.000Z",
            totalSent: 3,
            reminderCount: 1,
            lastRemindedAt: "2026-01-09T09:00:00.000Z",
            warningCount: 0,
            lastWarningAt: null,
          },
        },
        {
          id: "rec-2",
          name: "Ada Signer",
          email: "ada@example.com",
          status: "pending",
          effectiveStatus: "pending",
          signedOn: null,
          signingOrder: 2,
          delivery: {
            firstSentOn: "2026-01-02T09:00:00.000Z",
            lastSentOn: "2026-01-02T09:00:00.000Z",
            totalSent: 1,
            reminderCount: 0,
            // Stamped by the initial send — NOT evidence of a reminder.
            lastRemindedAt: "2026-01-02T09:00:00.000Z",
            warningCount: 0,
            lastWarningAt: null,
          },
        },
      ],
      summary: { total: 2, pending: 1, viewed: 0, completed: 1, voided: 0, expired: 0, waitingOn: 1 },
    };

    // A voided document: the unsigned signer is stranded, the signed one keeps their signature.
    const mockVoidedRecipientsResponse = {
      ...mockRecipientsResponse,
      document: { ...mockRecipientsResponse.document, status: "voided" },
      recipients: [
        { ...mockRecipientsResponse.recipients[0] },
        { ...mockRecipientsResponse.recipients[1], effectiveStatus: "voided" },
      ],
      summary: { total: 2, pending: 0, viewed: 0, completed: 1, voided: 1, expired: 0, waitingOn: 0 },
    };

    it("should get every recipient with their signing status", async () => {
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockRecipientsResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getRecipients("doc-123");

      expect(result.recipients).toHaveLength(2);
      expect(result.recipients[0].status).toBe("completed");
      expect(result.recipients[0].effectiveStatus).toBe("completed");
      expect(result.recipients[0].email).toBe("john@example.com");
      expect(result.recipients[0].signedOn).toBe("2026-02-01T10:00:00.000Z");
      expect(result.recipients[0].signingOrder).toBe(1);
      // A pending signer has no signedOn timestamp
      expect(result.recipients[1].status).toBe("pending");
      expect(result.recipients[1].signedOn).toBeNull();
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/recipients"
      );
    });

    it("should expose who sent the document and the pending/completed roll-up", async () => {
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockRecipientsResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getRecipients("doc-123");

      expect(result.document.sentBy).toEqual({
        name: "Jane Sender",
        email: "jane@acme.com",
      });
      // Document status distinguishes a voided/expired doc from one still waiting
      expect(result.document.status).toBe("under_review");
      expect(result.document.sentOn).toBe("2026-01-02T08:59:00.000Z");
      expect(result.summary).toEqual({
        total: 2,
        pending: 1,
        viewed: 0,
        completed: 1,
        voided: 0,
        expired: 0,
        waitingOn: 1,
      });
    });

    it("should report each recipient's email history", async () => {
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockRecipientsResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getRecipients("doc-123");

      expect(result.recipients[0].delivery.totalSent).toBe(3);
      expect(result.recipients[0].delivery.firstSentOn).toBe(
        "2026-01-02T09:00:00.000Z"
      );
      expect(result.recipients[0].delivery.lastSentOn).toBe(
        "2026-01-09T09:00:00.000Z"
      );
      expect(result.recipients[0].delivery.reminderCount).toBe(1);
      // A recipient emailed once has matching first/last and no reminders
      // Emailed once and never reminded: reminderCount stays 0, but lastRemindedAt is
      // NOT null — the initial send stamps it as the reminder cadence clock. Asserting
      // null here would enshrine the exact misreading the field docs warn about.
      expect(result.recipients[1].delivery.totalSent).toBe(1);
      expect(result.recipients[1].delivery.reminderCount).toBe(0);
      expect(result.recipients[1].delivery.lastRemindedAt).toBe(
        result.recipients[1].delivery.firstSentOn,
      );
    });

    it("should surface voided as an effective status without revoking a signature", async () => {
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockVoidedRecipientsResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getRecipients("doc-123");

      // Someone who signed still signed — voiding the document does not undo it
      expect(result.recipients[0].effectiveStatus).toBe("completed");
      // The unsigned signer is stranded, though the raw DB status is still "pending"
      expect(result.recipients[1].status).toBe("pending");
      expect(result.recipients[1].effectiveStatus).toBe("voided");
      expect(result.summary.voided).toBe(1);
      expect(result.summary.waitingOn).toBe(0);
    });

    it("should propagate NotFoundError for an unknown document", async () => {
      const notFound = new NotFoundError("Document not found");
      MockedHttpClient.prototype.get = jest
        .fn()
        .mockRejectedValue(notFound);
      TurboSign.configure({ apiKey: "test-key" });

      await expect(TurboSign.getRecipients("missing-doc")).rejects.toThrow(
        NotFoundError
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

    it("should throw NetworkError (not generic Error) when S3 download fails", async () => {
      const mockPresignedResponse = {
        downloadUrl: "https://s3.example.com/presigned-url",
        fileName: "signed-document.pdf",
      };

      const mockFetchResponse = {
        ok: false,
        status: 403,
        statusText: "Forbidden",
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockPresignedResponse);
      mockFetch.mockResolvedValue(mockFetchResponse);
      TurboSign.configure({ apiKey: "test-key" });

      await expect(TurboSign.download("doc-123")).rejects.toBeInstanceOf(
        NetworkError
      );
    });
  });

  describe("void", () => {
    it("should void a document with reason", async () => {
      // HTTP client auto-unwraps {data: ...} responses
      const mockResponse = {
        id: "doc-123",
        name: "Test Document",
        status: "voided",
        voidReason: "Document needs revision",
        voidedAt: "2026-01-26T12:00:00.000Z",
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.void("doc-123", "Document needs revision");

      expect(result.id).toBe("doc-123");
      expect(result.name).toBe("Test Document");
      expect(result.status).toBe("voided");
      expect(result.voidReason).toBe("Document needs revision");
      expect(result.voidedAt).toBe("2026-01-26T12:00:00.000Z");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/void",
        { reason: "Document needs revision" }
      );
    });
  });

  describe("resend", () => {
    it("should resend email to specific recipients", async () => {
      // HTTP client auto-unwraps {data: ...} responses
      const mockResponse = {
        success: true,
        recipientCount: 2,
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.resend("doc-123", ["rec-1", "rec-2"]);

      expect(result.success).toBe(true);
      expect(result.recipientCount).toBe(2);
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/resend-email",
        { recipientIds: ["rec-1", "rec-2"] }
      );
    });

    it("should resend email to all recipients when empty array", async () => {
      // HTTP client auto-unwraps {data: ...} responses
      const mockResponse = {
        success: true,
        recipientCount: 3,
      };

      MockedHttpClient.prototype.post = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.resend("doc-123", []);

      expect(result.success).toBe(true);
      expect(result.recipientCount).toBe(3);
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/resend-email",
        { recipientIds: [] }
      );
    });
  });

  describe("getAuditTrail", () => {
    it("should get audit trail for a document", async () => {
      // HTTP client auto-unwraps {data: ...} responses
      const mockResponse = {
        document: {
          id: "doc-123",
          name: "Test Document",
        },
        auditTrail: [
          {
            id: "audit-1",
            documentId: "doc-123",
            actionType: "document_created",
            timestamp: "2024-01-01T10:00:00Z",
          },
          {
            id: "audit-2",
            documentId: "doc-123",
            actionType: "email_sent",
            timestamp: "2024-01-01T10:01:00Z",
          },
          {
            id: "audit-3",
            documentId: "doc-123",
            actionType: "document_viewed",
            timestamp: "2024-01-01T11:00:00Z",
          },
          {
            id: "audit-4",
            documentId: "doc-123",
            actionType: "document_signed",
            timestamp: "2024-01-01T11:05:00Z",
          },
        ],
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getAuditTrail("doc-123");

      expect(result.document.id).toBe("doc-123");
      expect(result.document.name).toBe("Test Document");
      expect(result.auditTrail).toHaveLength(4);
      expect(result.auditTrail[0].actionType).toBe("document_created");
      expect(result.auditTrail[3].actionType).toBe("document_signed");
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/turbosign/documents/doc-123/audit-trail"
      );
    });

    it("should return empty entries for new document", async () => {
      // HTTP client auto-unwraps {data: ...} responses
      const mockResponse = {
        document: {
          id: "doc-new",
          name: "New Document",
        },
        auditTrail: [],
      };

      MockedHttpClient.prototype.get = jest
        .fn()
        .mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: "test-key" });

      const result = await TurboSign.getAuditTrail("doc-new");

      expect(result.document.id).toBe("doc-new");
      expect(result.auditTrail).toHaveLength(0);
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
