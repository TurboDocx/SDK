/**
 * TurboSign Module - Digital signature operations
 */

import { HttpClient, HttpClientConfig } from '../http';
import {
  UploadDocumentResponse,
  AddRecipientsRequest,
  AddRecipientsResponse,
  PrepareSigningRequest,
  PrepareSigningResponse,
  VoidDocumentResponse,
  ResendEmailResponse,
  AuditTrailResponse,
  DocumentStatusResponse,
} from '../types/sign';

export class TurboSign {
  private static client: HttpClient;

  /**
   * Configure the TurboSign module with API credentials
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

  /**
   * Step 1: Upload a document for signing
   *
   * @param file - PDF file to upload (File or Buffer)
   * @param name - Optional custom name for the document
   * @returns Document upload response with documentId
   *
   * @example
   * ```typescript
   * const upload = await TurboSign.uploadDocument(pdfFile, 'Contract.pdf');
   * console.log(upload.documentId);
   * ```
   */
  static async uploadDocument(
    file: File | Buffer,
    name?: string
  ): Promise<UploadDocumentResponse> {
    const client = this.getClient();
    const additionalData: Record<string, any> = {};

    if (name) {
      additionalData.name = name;
    }

    return await client.uploadFile<UploadDocumentResponse>(
      '/sign/upload',
      file,
      'document',
      additionalData
    );
  }

  /**
   * Step 2: Add recipients to the document
   *
   * @param documentId - ID of the uploaded document
   * @param recipients - Array of recipients who will sign
   * @returns Recipients with their IDs and sign URLs
   *
   * @example
   * ```typescript
   * const recipients = await TurboSign.addRecipients(documentId, [
   *   { email: 'john@example.com', name: 'John Doe', order: 1 },
   *   { email: 'jane@example.com', name: 'Jane Smith', order: 2 }
   * ]);
   * ```
   */
  static async addRecipients(
    documentId: string,
    recipients: AddRecipientsRequest['recipients']
  ): Promise<AddRecipientsResponse> {
    const client = this.getClient();
    return await client.post<AddRecipientsResponse>(
      `/sign/${documentId}/recipients`,
      { recipients }
    );
  }

  /**
   * Step 3: Prepare document for signing by placing signature fields
   *
   * @param documentId - ID of the document
   * @param request - Signature fields and configuration
   * @returns Document ready for signing with recipient sign URLs
   *
   * @example
   * ```typescript
   * // Using coordinate-based positioning
   * const result = await TurboSign.prepareForSigning(documentId, {
   *   fields: [
   *     {
   *       type: 'signature',
   *       recipientId: recipients[0].id,
   *       page: 1,
   *       x: 100,
   *       y: 200,
   *       width: 200,
   *       height: 50
   *     },
   *     {
   *       type: 'date',
   *       recipientId: recipients[0].id,
   *       page: 1,
   *       x: 100,
   *       y: 300
   *     }
   *   ],
   *   webhookUrl: 'https://your-app.com/webhook',
   *   sendEmails: true
   * });
   * ```
   */
  static async prepareForSigning(
    documentId: string,
    request: PrepareSigningRequest
  ): Promise<PrepareSigningResponse> {
    const client = this.getClient();
    return await client.post<PrepareSigningResponse>(
      `/sign/${documentId}/prepare`,
      request
    );
  }

  /**
   * Complete workflow: Upload, add recipients, and prepare in one call
   *
   * @param file - PDF file to upload
   * @param recipients - Recipients who will sign
   * @param fields - Signature fields configuration
   * @param options - Additional options (webhookUrl, message, etc.)
   * @returns Prepared document with sign URLs
   *
   * @example
   * ```typescript
   * const result = await TurboSign.createSignatureRequest({
   *   file: pdfFile,
   *   recipients: [
   *     { email: 'john@example.com', name: 'John Doe' }
   *   ],
   *   fields: [
   *     { type: 'signature', recipientId: 'will-be-assigned', page: 1, x: 100, y: 200 }
   *   ],
   *   webhookUrl: 'https://your-app.com/webhook'
   * });
   * ```
   */
  static async createSignatureRequest(params: {
    file: File | Buffer;
    fileName?: string;
    recipients: AddRecipientsRequest['recipients'];
    fields: PrepareSigningRequest['fields'];
    webhookUrl?: string;
    message?: string;
    sendEmails?: boolean;
  }): Promise<PrepareSigningResponse> {
    // Step 1: Upload document
    const upload = await this.uploadDocument(params.file, params.fileName);

    // Step 2: Add recipients
    const recipientsResponse = await this.addRecipients(
      upload.documentId,
      params.recipients
    );

    // Step 3: Map recipient emails to IDs for fields
    const recipientMap = new Map(
      recipientsResponse.recipients.map(r => [r.email, r.id])
    );

    const fieldsWithRecipientIds = params.fields.map(field => {
      // If recipientId is already set and valid, use it
      if (field.recipientId && recipientMap.has(field.recipientId)) {
        return field;
      }

      // Otherwise, try to find recipient by matching order or use first recipient
      const recipient = recipientsResponse.recipients[0];
      return {
        ...field,
        recipientId: recipient.id
      };
    });

    // Step 4: Prepare for signing
    return await this.prepareForSigning(upload.documentId, {
      fields: fieldsWithRecipientIds,
      webhookUrl: params.webhookUrl,
      message: params.message,
      sendEmails: params.sendEmails,
    });
  }

  /**
   * Void a document (cancel signature request)
   *
   * @param documentId - ID of the document to void
   * @returns Void confirmation
   *
   * @example
   * ```typescript
   * await TurboSign.void(documentId);
   * ```
   */
  static async void(documentId: string): Promise<VoidDocumentResponse> {
    const client = this.getClient();
    return await client.post<VoidDocumentResponse>(`/sign/${documentId}/void`);
  }

  /**
   * Resend signature request email to recipients
   *
   * @param documentId - ID of the document
   * @param recipientId - Optional specific recipient ID to resend to
   * @returns Resend confirmation
   *
   * @example
   * ```typescript
   * await TurboSign.resend(documentId);
   * ```
   */
  static async resend(
    documentId: string,
    recipientId?: string
  ): Promise<ResendEmailResponse> {
    const client = this.getClient();
    const body = recipientId ? { recipientId } : undefined;
    return await client.post<ResendEmailResponse>(
      `/sign/${documentId}/resend`,
      body
    );
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
    return await client.get<AuditTrailResponse>(`/sign/${documentId}/audit-trail`);
  }

  /**
   * Download the signed document
   *
   * @param documentId - ID of the document
   * @returns Response with the PDF file
   *
   * @example
   * ```typescript
   * const response = await TurboSign.download(documentId);
   * // Save to file or process the PDF
   * ```
   */
  static async download(documentId: string): Promise<Response> {
    const client = this.getClient();
    return await client.get<Response>(`/sign/${documentId}/download`);
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
    return await client.get<DocumentStatusResponse>(`/sign/${documentId}`);
  }
}
