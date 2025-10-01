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
   * @param description - Optional description for the document
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
    name?: string,
    description?: string
  ): Promise<UploadDocumentResponse> {
    const client = this.getClient();
    const additionalData: Record<string, any> = {};

    if (name) {
      additionalData.name = name;
    }
    if (description) {
      additionalData.description = description;
    }

    const response = await client.uploadFile<{ data: UploadDocumentResponse }>(
      '/turbosign/documents/upload',
      file,
      'file',
      additionalData
    );
    return response.data;
  }

  /**
   * Create a signature document from an existing deliverable
   *
   * @param deliverableId - ID of the deliverable to create a signature document from
   * @param name - Optional custom name for the document
   * @param description - Optional description for the document
   * @returns Document upload response with documentId
   *
   * @example
   * ```typescript
   * const upload = await TurboSign.createFromDeliverable('deliverable-id', 'Contract.pdf');
   * console.log(upload.documentId);
   * ```
   */
  static async createFromDeliverable(
    deliverableId: string,
    name?: string,
    description?: string
  ): Promise<UploadDocumentResponse> {
    const client = this.getClient();
    const body: Record<string, any> = { deliverableId };

    if (name) {
      body.name = name;
    }
    if (description) {
      body.description = description;
    }

    const response = await client.post<{ data: UploadDocumentResponse }>(
      '/turbosign/documents/from-deliverable',
      body
    );
    return response.data;
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
    const response = await client.post<{ data: AddRecipientsResponse }>(
      `/turbosign/documents/${documentId}/update-with-recipients`,
      { document: {}, recipients }
    );
    return response.data;
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
    const response = await client.post<{ data: PrepareSigningResponse }>(
      `/turbosign/documents/${documentId}/prepare-for-signing`,
      request.fields
    );
    return response.data;
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
   * @returns Response with the PDF file
   *
   * @example
   * ```typescript
   * const response = await TurboSign.download(documentId);
   * // Save to file or process the PDF
   * ```
   */
  static async download(documentId: string): Promise<Blob> {
    const client = this.getClient();
    const response = await client.get<Blob>(`/turbosign/documents/${documentId}/download`);
    return response;
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
