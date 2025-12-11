/**
 * TurboSign Sender Configuration Tests
 *
 * Tests to ensure senderEmail/senderName from configuration are properly used
 * in signature requests, with per-request override capability
 */

import { TurboSign } from '../src/modules/sign';
import { HttpClient } from '../src/http';
import type { N8nRecipient, N8nField } from '../src/types/sign';

// Mock the HttpClient
jest.mock('../src/http');

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('TurboSign Sender Configuration', () => {
  const mockRecipients: N8nRecipient[] = [
    { name: 'John Doe', email: 'john@example.com', signingOrder: 1 },
  ];
  const mockFields: N8nField[] = [
    {
      type: 'signature',
      page: 1,
      x: 100,
      y: 500,
      width: 200,
      height: 50,
      recipientEmail: 'john@example.com',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (TurboSign as any).client = undefined;
  });

  describe('createSignatureReviewLink with configured sender', () => {
    it('should use configured senderEmail when not provided in request', async () => {
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      };

      MockedHttpClient.prototype.getSenderConfig = jest
        .fn()
        .mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-123',
        status: 'review_ready',
        message: 'Document prepared',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      });

      await TurboSign.createSignatureReviewLink({
        fileLink: 'https://example.com/doc.pdf',
        recipients: mockRecipients,
        fields: mockFields,
        // senderEmail and senderName NOT provided - should use configured values
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-review',
        expect.objectContaining({
          senderEmail: 'configured@company.com',
          senderName: 'Configured Support',
        })
      );
    });

    it('should use configured senderEmail only when senderName not configured', async () => {
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: undefined,
      };

      MockedHttpClient.prototype.getSenderConfig = jest
        .fn()
        .mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-123',
        status: 'review_ready',
        message: 'Document prepared',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
      });

      await TurboSign.createSignatureReviewLink({
        fileLink: 'https://example.com/doc.pdf',
        recipients: mockRecipients,
        fields: mockFields,
      });

      const callArgs = (MockedHttpClient.prototype.post as jest.Mock).mock.calls[0][1];
      expect(callArgs.senderEmail).toBe('configured@company.com');
      expect(callArgs.senderName).toBeUndefined();
    });

    it('should override configured sender with request-level sender', async () => {
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      };

      MockedHttpClient.prototype.getSenderConfig = jest
        .fn()
        .mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-123',
        status: 'review_ready',
        message: 'Document prepared',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      });

      await TurboSign.createSignatureReviewLink({
        fileLink: 'https://example.com/doc.pdf',
        recipients: mockRecipients,
        fields: mockFields,
        senderEmail: 'override@company.com', // Override configured value
        senderName: 'Override Support',
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-review',
        expect.objectContaining({
          senderEmail: 'override@company.com',
          senderName: 'Override Support',
        })
      );
    });

    it('should partially override - use request senderEmail but configured senderName', async () => {
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      };

      MockedHttpClient.prototype.getSenderConfig = jest
        .fn()
        .mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-123',
        status: 'review_ready',
        message: 'Document prepared',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      });

      await TurboSign.createSignatureReviewLink({
        fileLink: 'https://example.com/doc.pdf',
        recipients: mockRecipients,
        fields: mockFields,
        senderEmail: 'override@company.com',
        // senderName NOT provided - should use configured value
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-review',
        expect.objectContaining({
          senderEmail: 'override@company.com',
          senderName: 'Configured Support',
        })
      );
    });
  });

  describe('sendSignature with configured sender', () => {
    it('should use configured senderEmail and senderName', async () => {
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      };

      MockedHttpClient.prototype.getSenderConfig = jest
        .fn()
        .mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-123',
        message: 'Document sent for signing',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      });

      await TurboSign.sendSignature({
        fileLink: 'https://example.com/doc.pdf',
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-signing',
        expect.objectContaining({
          senderEmail: 'configured@company.com',
          senderName: 'Configured Support',
        })
      );
    });

    it('should allow request-level override in sendSignature', async () => {
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      };

      MockedHttpClient.prototype.getSenderConfig = jest
        .fn()
        .mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-123',
        message: 'Document sent for signing',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      });

      await TurboSign.sendSignature({
        fileLink: 'https://example.com/doc.pdf',
        recipients: mockRecipients,
        fields: mockFields,
        senderEmail: 'sales@company.com',
        senderName: 'Sales Team',
      });

      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-signing',
        expect.objectContaining({
          senderEmail: 'sales@company.com',
          senderName: 'Sales Team',
        })
      );
    });
  });

  describe('file upload with configured sender', () => {
    it('should use configured sender in file upload requests', async () => {
      const mockFile = Buffer.from('mock-pdf-content');
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      };

      MockedHttpClient.prototype.getSenderConfig = jest
        .fn()
        .mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.uploadFile = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-upload',
        status: 'review_ready',
        message: 'Document prepared',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      });

      await TurboSign.createSignatureReviewLink({
        file: mockFile,
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(MockedHttpClient.prototype.uploadFile).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-review',
        mockFile,
        'file',
        expect.objectContaining({
          senderEmail: 'configured@company.com',
          senderName: 'Configured Support',
        })
      );
    });

    it('should override configured sender in file upload requests', async () => {
      const mockFile = Buffer.from('mock-pdf-content');
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      };

      MockedHttpClient.prototype.getSenderConfig = jest
        .fn()
        .mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.uploadFile = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-upload',
        status: 'review_ready',
        message: 'Document prepared',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      });

      await TurboSign.createSignatureReviewLink({
        file: mockFile,
        recipients: mockRecipients,
        fields: mockFields,
        senderEmail: 'specific@company.com',
        senderName: 'Specific Team',
      });

      expect(MockedHttpClient.prototype.uploadFile).toHaveBeenCalledWith(
        '/turbosign/single/prepare-for-review',
        mockFile,
        'file',
        expect.objectContaining({
          senderEmail: 'specific@company.com',
          senderName: 'Specific Team',
        })
      );
    });
  });

  describe('getSenderConfig called correctly', () => {
    it('should call getSenderConfig once per request', async () => {
      const mockSenderConfig = {
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      };

      const getSenderConfigMock = jest.fn().mockReturnValue(mockSenderConfig);
      MockedHttpClient.prototype.getSenderConfig = getSenderConfigMock;
      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue({
        success: true,
        documentId: 'doc-123',
        status: 'review_ready',
        message: 'Document prepared',
      });

      TurboSign.configure({
        apiKey: 'test-key',
        orgId: 'test-org',
        senderEmail: 'configured@company.com',
        senderName: 'Configured Support',
      });

      await TurboSign.createSignatureReviewLink({
        fileLink: 'https://example.com/doc.pdf',
        recipients: mockRecipients,
        fields: mockFields,
      });

      expect(getSenderConfigMock).toHaveBeenCalledTimes(1);
    });
  });
});
