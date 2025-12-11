/**
 * TurboSign Module - Digital signature operations
 */

import { HttpClient, HttpClientConfig } from '../http';
import {
  VoidDocumentResponse,
  ResendEmailResponse,
  AuditTrailResponse,
  DocumentStatusResponse,
  CreateSignatureReviewLinkRequest,
  CreateSignatureReviewLinkResponse,
  SendSignatureRequest,
  SendSignatureResponse,
} from '../types/sign';

export class TurboSign {
  private static client: HttpClient;

  /**
   * Configure the TurboSign module with API credentials
   *
   * @param config - Configuration object
   * @param config.apiKey - TurboDocx API key (required)
   * @param config.orgId - Organization ID (required)
   * @param config.senderEmail - Reply-to email address for signature requests (required). This email will be used as the reply-to address when sending signature request emails. Without it, emails will default to "API Service User via TurboSign".
   * @param config.senderName - Sender name for signature requests (optional but strongly recommended). This name will appear in signature request emails. Without this, the sender will appear as "API Service User".
   * @param config.baseUrl - API base URL (optional, defaults to https://api.turbodocx.com)
   *
   * @example
   * ```typescript
   * TurboSign.configure({
   *   apiKey: process.env.TURBODOCX_API_KEY,
   *   orgId: process.env.TURBODOCX_ORG_ID,
   *   senderEmail: 'support@yourcompany.com',
   *   senderName: 'Your Company Name'  // Strongly recommended
   * });
   * ```
   */
  static configure(config: HttpClientConfig): void {
    this.client = new HttpClient(config);
  }

  /**
   * Get the HTTP client instance, initializing if necessary
   */
  private static getClient(): HttpClient {
    if (!this.client) {
      // Auto-initialize with environment variables if not configured
      this.client = new HttpClient();
    }
    return this.client;
  }

  // ============================================
  // SINGLE-STEP OPERATIONS
  // ============================================

  /**
   * Create signature review link without sending emails
   *
   * This method uploads a document with signature fields and recipients,
   * but does NOT send signature request emails. Use this to preview
   * field placement before sending.
   *
   * @param request - Document, recipients, and fields configuration
   * @returns Document ready for review with preview URL
   *
   * @example
   * ```typescript
   * // Using file upload
   * const result = await TurboSign.createSignatureReviewLink({
   *   file: pdfBuffer,
   *   recipients: [{ name: 'John Doe', email: 'john@example.com', signingOrder: 1 }],
   *   fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientEmail: 'john@example.com' }]
   * });
   *
   * // Using file URL
   * const result = await TurboSign.createSignatureReviewLink({
   *   fileLink: 'https://storage.example.com/contract.pdf',
   *   recipients: [{ name: 'John Doe', email: 'john@example.com', signingOrder: 1 }],
   *   fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientEmail: 'john@example.com' }]
   * });
   *
   * // Using deliverable ID (from TurboDocx document generation)
   * const result = await TurboSign.createSignatureReviewLink({
   *   deliverableId: 'deliverable-uuid',
   *   recipients: [{ name: 'John Doe', email: 'john@example.com', signingOrder: 1 }],
   *   fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientEmail: 'john@example.com' }]
   * });
   * ```
   */
  static async createSignatureReviewLink(request: CreateSignatureReviewLinkRequest): Promise<CreateSignatureReviewLinkResponse> {
    const client = this.getClient();

    // Get sender config from client
    const senderConfig = client.getSenderConfig();

    // Serialize recipients and fields to JSON strings (as n8n node does)
    const recipientsJson = JSON.stringify(request.recipients);
    const fieldsJson = JSON.stringify(request.fields);

    // Build form data
    const formData: Record<string, any> = {
      recipients: recipientsJson,
      fields: fieldsJson,
    };

    // Add optional fields
    if (request.documentName) formData.documentName = request.documentName;
    if (request.documentDescription) formData.documentDescription = request.documentDescription;

    // Use request senderEmail/senderName if provided, otherwise fall back to configured values
    formData.senderEmail = request.senderEmail || senderConfig.senderEmail;
    if (request.senderName || senderConfig.senderName) {
      formData.senderName = request.senderName || senderConfig.senderName;
    }

    if (request.ccEmails) {
      formData.ccEmails = Array.isArray(request.ccEmails)
        ? JSON.stringify(request.ccEmails)
        : JSON.stringify([request.ccEmails]);
    }

    // Handle different file input methods
    if (request.file) {
      // File upload - use multipart form
      const response = await client.uploadFile<CreateSignatureReviewLinkResponse>(
        '/turbosign/single/prepare-for-review',
        request.file,
        'file',
        formData
      );
      return response;
    } else {
      // URL, deliverable, or template - use JSON body
      if (request.fileLink) formData.fileLink = request.fileLink;
      if (request.deliverableId) formData.deliverableId = request.deliverableId;
      if (request.templateId) formData.templateId = request.templateId;

      const response = await client.post<CreateSignatureReviewLinkResponse>(
        '/turbosign/single/prepare-for-review',
        formData
      );
      return response;
    }
  }

  /**
   * Send signature request and immediately send emails
   *
   * This method uploads a document with signature fields and recipients,
   * then immediately sends signature request emails to all recipients.
   *
   * @param request - Document, recipients, and fields configuration
   * @returns Document with confirmation message
   *
   * @example
   * ```typescript
   * // Using file upload
   * const result = await TurboSign.sendSignature({
   *   file: pdfBuffer,
   *   recipients: [
   *     { name: 'John Doe', email: 'john@example.com', signingOrder: 1 },
   *     { name: 'Jane Smith', email: 'jane@example.com', signingOrder: 2 }
   *   ],
   *   fields: [
   *     { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientEmail: 'john@example.com' },
   *     { type: 'signature', page: 1, x: 100, y: 600, width: 200, height: 50, recipientEmail: 'jane@example.com' }
   *   ]
   * });
   * ```
   */
  static async sendSignature(request: SendSignatureRequest): Promise<SendSignatureResponse> {
    const client = this.getClient();

    // Get sender config from client
    const senderConfig = client.getSenderConfig();

    // Serialize recipients and fields to JSON strings (as n8n node does)
    const recipientsJson = JSON.stringify(request.recipients);
    const fieldsJson = JSON.stringify(request.fields);

    // Build form data
    const formData: Record<string, any> = {
      recipients: recipientsJson,
      fields: fieldsJson,
    };

    // Add optional fields
    if (request.documentName) formData.documentName = request.documentName;
    if (request.documentDescription) formData.documentDescription = request.documentDescription;

    // Use request senderEmail/senderName if provided, otherwise fall back to configured values
    formData.senderEmail = request.senderEmail || senderConfig.senderEmail;
    if (request.senderName || senderConfig.senderName) {
      formData.senderName = request.senderName || senderConfig.senderName;
    }

    if (request.ccEmails) {
      formData.ccEmails = Array.isArray(request.ccEmails)
        ? JSON.stringify(request.ccEmails)
        : JSON.stringify([request.ccEmails]);
    }

    // Handle different file input methods
    if (request.file) {
      // File upload - use multipart form
      const response = await client.uploadFile<SendSignatureResponse>(
        '/turbosign/single/prepare-for-signing',
        request.file,
        'file',
        formData
      );
      return response;
    } else {
      // URL, deliverable, or template - use JSON body
      if (request.fileLink) formData.fileLink = request.fileLink;
      if (request.deliverableId) formData.deliverableId = request.deliverableId;
      if (request.templateId) formData.templateId = request.templateId;

      const response = await client.post<SendSignatureResponse>(
        '/turbosign/single/prepare-for-signing',
        formData
      );
      return response;
    }
  }

  // ============================================
  // DOCUMENT MANAGEMENT
  // ============================================

  /**
   * Void a document (cancel signature request)
   *
   * @param documentId - ID of the document to void
   * @param reason - Reason for voiding the document
   * @returns Void confirmation
   *
   * @example
   * ```typescript
   * await TurboSign.void(documentId, 'Document needs to be revised');
   * ```
   */
  static async void(documentId: string, reason: string): Promise<VoidDocumentResponse> {
    const client = this.getClient();
    const response = await client.post<{ data: VoidDocumentResponse }>(
      `/turbosign/documents/${documentId}/void`,
      { reason }
    );
    return response.data;
  }

  /**
   * Resend signature request email to recipients
   *
   * @param documentId - ID of the document
   * @param recipientIds - Array of recipient IDs to resend emails to
   * @returns Resend confirmation
   *
   * @example
   * ```typescript
   * // Resend to specific recipients
   * await TurboSign.resend(documentId, [recipientId1, recipientId2]);
   *
   * // Resend to all recipients
   * await TurboSign.resend(documentId, []);
   * ```
   */
  static async resend(
    documentId: string,
    recipientIds: string[]
  ): Promise<ResendEmailResponse> {
    const client = this.getClient();
    const response = await client.post<{ data: ResendEmailResponse }>(
      `/turbosign/documents/${documentId}/resend-email`,
      { recipientIds }
    );
    return response.data;
  }

  /**
   * Get the audit trail for a document
   *
   * @param documentId - ID of the document
   * @returns Audit trail entries
   *
   * @example
   * ```typescript
   * const auditTrail = await TurboSign.getAuditTrail(documentId);
   * console.log(auditTrail.entries);
   * ```
   */
  static async getAuditTrail(documentId: string): Promise<AuditTrailResponse> {
    const client = this.getClient();
    const response = await client.get<{ data: AuditTrailResponse }>(`/turbosign/documents/${documentId}/audit-trail`);
    return response.data;
  }

  /**
   * Download the signed document
   *
   * @param documentId - ID of the document
   * @returns Response with the PDF file as Blob
   *
   * @example
   * ```typescript
   * const blob = await TurboSign.download(documentId);
   * // Save to file or process the PDF
   * ```
   */
  static async download(documentId: string): Promise<Blob> {
    const client = this.getClient();
    // Step 1: Get the presigned URL from the API
    const response = await client.get<{ downloadUrl: string; fileName: string }>(
      `/turbosign/documents/${documentId}/download`
    );

    // Step 2: Fetch the actual file from S3
    const fileResponse = await fetch(response.downloadUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    // Step 3: Return as Blob
    const arrayBuffer = await fileResponse.arrayBuffer();
    return new Blob([arrayBuffer], { type: 'application/pdf' });
  }

  /**
   * Get the status of a document
   *
   * @param documentId - ID of the document
   * @returns Document status and recipient information
   *
   * @example
   * ```typescript
   * const status = await TurboSign.getStatus(documentId);
   * console.log(status.status); // 'completed', 'pending', etc.
   * ```
   */
  static async getStatus(documentId: string): Promise<DocumentStatusResponse> {
    const client = this.getClient();
    const response = await client.get<{ data: DocumentStatusResponse }>(`/turbosign/documents/${documentId}/status`);
    return response.data;
  }
}
