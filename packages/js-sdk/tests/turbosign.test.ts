/**
 * TurboSign Module Tests
 *
 * Tests for 100% parity with n8n-nodes-turbodocx operations:
 * - prepareForReview
 * - prepareForSigning (single call)
 * - getStatus
 * - downloadDocument
 * - voidDocument
 * - resendEmail
 */

import { TurboSign } from '../src/modules/sign';
import { HttpClient } from '../src/http';
import type { N8nRecipient, N8nField } from '../src/types/sign';

// Mock the HttpClient
jest.mock('../src/http');

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('TurboSign Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static client
    (TurboSign as any).client = undefined;
  });

  describe('configure', () => {
    it('should configure the client with API key', () => {
      TurboSign.configure({ apiKey: 'test-api-key' });
      expect(MockedHttpClient).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });

    it('should configure with custom base URL', () => {
      TurboSign.configure({
        apiKey: 'test-api-key',
        baseUrl: 'https://custom-api.example.com'
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseUrl: 'https://custom-api.example.com'
      });
    });
  });

  describe('prepareForReview', () => {
    const mockFile = Buffer.from('mock-pdf-content');
    const mockRecipients: N8nRecipient[] = [
      { name: 'John Doe', email: 'john@example.com', order: 1 }
    ];
    const mockFields: N8nField[] = [
      { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
    ];

    it('should prepare document for review with file upload', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-123',
          status: 'review_ready',
          previewUrl: 'https://preview.example.com/doc-123',
          recipients: [
            { id: 'rec-1', name: 'John Doe', email: 'john@example.com', status: 'pending' }
          ]
        }
      };

      MockedHttpClient.prototype.uploadFile = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.prepareForReview({
        file: mockFile,
        recipients: mockRecipients,
        fields: mockFields
      });

      expect(result.documentId).toBe('doc-123');
      expect(result.status).toBe('review_ready');
      expect(result.previewUrl).toBeDefined();
    });

    it('should prepare document for review with file URL', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-456',
          status: 'review_ready',
          previewUrl: 'https://preview.example.com/doc-456'
        }
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.prepareForReview({
        fileLink: 'https://storage.example.com/contract.pdf',
        recipients: mockRecipients,
        fields: mockFields
      });

      expect(result.documentId).toBe('doc-456');
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-review',
        expect.objectContaining({
          fileLink: 'https://storage.example.com/contract.pdf',
          recipients: expect.any(String),
          fields: expect.any(String)
        })
      );
    });

    it('should prepare document for review with deliverable ID', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-789',
          status: 'review_ready'
        }
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.prepareForReview({
        deliverableId: 'deliverable-abc',
        recipients: mockRecipients,
        fields: mockFields
      });

      expect(result.documentId).toBe('doc-789');
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-review',
        expect.objectContaining({
          deliverableId: 'deliverable-abc'
        })
      );
    });

    it('should prepare document for review with template ID', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-template',
          status: 'review_ready'
        }
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.prepareForReview({
        templateId: 'template-xyz',
        recipients: mockRecipients,
        fields: mockFields
      });

      expect(result.documentId).toBe('doc-template');
    });

    it('should include optional fields in request', async () => {
      const mockResponse = { data: { documentId: 'doc-123', status: 'review_ready' } };
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      await TurboSign.prepareForReview({
        fileLink: 'https://example.com/doc.pdf',
        recipients: mockRecipients,
        fields: mockFields,
        documentName: 'Test Contract',
        documentDescription: 'A test contract',
        senderName: 'Sales Team',
        senderEmail: 'sales@company.com',
        ccEmails: ['admin@company.com', 'legal@company.com']
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-review',
        expect.objectContaining({
          documentName: 'Test Contract',
          documentDescription: 'A test contract',
          senderName: 'Sales Team',
          senderEmail: 'sales@company.com',
          ccEmails: expect.any(String)
        })
      );
    });
  });

  describe('prepareForSigningSingle', () => {
    const mockRecipients: N8nRecipient[] = [
      { name: 'John Doe', email: 'john@example.com', order: 1 }
    ];
    const mockFields: N8nField[] = [
      { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
    ];

    it('should prepare document for signing and send emails', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-123',
          status: 'sent',
          recipients: [
            {
              id: 'rec-1',
              name: 'John Doe',
              email: 'john@example.com',
              status: 'pending',
              signUrl: 'https://sign.example.com/rec-1'
            }
          ]
        }
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.prepareForSigningSingle({
        fileLink: 'https://storage.example.com/contract.pdf',
        recipients: mockRecipients,
        fields: mockFields
      });

      expect(result.documentId).toBe('doc-123');
      expect(result.status).toBe('sent');
      expect(result.recipients[0].signUrl).toBeDefined();
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-signing',
        expect.any(Object)
      );
    });

    it('should handle file upload for signing', async () => {
      const mockFile = Buffer.from('mock-pdf-content');
      const mockResponse = {
        data: {
          documentId: 'doc-upload',
          status: 'sent'
        }
      };

      MockedHttpClient.prototype.uploadFile = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.prepareForSigningSingle({
        file: mockFile,
        fileName: 'contract.pdf',
        recipients: mockRecipients,
        fields: mockFields
      });

      expect(result.documentId).toBe('doc-upload');
    });
  });

  describe('getStatus', () => {
    it('should get document status', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-123',
          status: 'pending',
          name: 'Test Document',
          recipients: [
            { id: 'rec-1', name: 'John Doe', email: 'john@example.com', status: 'pending' }
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };

      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.getStatus('doc-123');

      expect(result.documentId).toBe('doc-123');
      expect(result.status).toBe('pending');
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        '/turbosign/documents/doc-123/status'
      );
    });
  });

  describe('download', () => {
    it('should download signed document as Blob', async () => {
      const mockPdfContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
      const mockBlob = new Blob([mockPdfContent], { type: 'application/pdf' });

      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockBlob);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.download('doc-123');

      expect(result).toBeInstanceOf(Blob);
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        '/turbosign/documents/doc-123/download'
      );
    });
  });

  describe('void', () => {
    it('should void a document with reason', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-123',
          status: 'voided',
          voidedAt: '2024-01-01T12:00:00Z'
        }
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.void('doc-123', 'Document needs revision');

      expect(result.documentId).toBe('doc-123');
      expect(result.status).toBe('voided');
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/documents/doc-123/void',
        { reason: 'Document needs revision' }
      );
    });
  });

  describe('resend', () => {
    it('should resend email to specific recipients', async () => {
      const mockResponse = {
        data: {
          documentId: 'doc-123',
          message: 'Emails resent successfully',
          resentAt: '2024-01-01T12:00:00Z'
        }
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      TurboSign.configure({ apiKey: 'test-key' });

      const result = await TurboSign.resend('doc-123', ['rec-1', 'rec-2']);

      expect(result.message).toContain('resent');
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/documents/doc-123/resend-email',
        { recipientIds: ['rec-1', 'rec-2'] }
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error when API key is not configured', async () => {
      // Don't configure, let it auto-initialize without API key
      MockedHttpClient.prototype.get = jest.fn().mockRejectedValue(
        new Error('API key is required')
      );

      await expect(TurboSign.getStatus('doc-123')).rejects.toThrow();
    });

    it('should handle API errors gracefully', async () => {
      const apiError = {
        statusCode: 404,
        message: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND'
      };

      MockedHttpClient.prototype.get = jest.fn().mockRejectedValue(apiError);
      TurboSign.configure({ apiKey: 'test-key' });

      await expect(TurboSign.getStatus('invalid-doc')).rejects.toEqual(apiError);
    });

    it('should handle validation errors', async () => {
      const validationError = {
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          { path: ['recipients', 0, 'email'], message: 'Invalid email format' }
        ]
      };

      MockedHttpClient.prototype.post = jest.fn().mockRejectedValue(validationError);
      TurboSign.configure({ apiKey: 'test-key' });

      await expect(
        TurboSign.prepareForSigningSingle({
          fileLink: 'https://example.com/doc.pdf',
          recipients: [{ name: 'Test', email: 'invalid-email', order: 1 }],
          fields: []
        })
      ).rejects.toEqual(validationError);
    });
  });
});
