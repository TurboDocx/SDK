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
  DocumentWithRecipients,
  DocumentFileResponse,
  DocumentFieldResponse,
  SignatureDocumentListItem,
  RecipientFieldResponse,
  SubmitSignedDocumentResponse,
  PublicDocumentStatusResponse,
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

  /**
   * Get document with recipients including their metadata (colors, etc.)
   *
   * @param documentId - ID of the document
   * @returns Document with recipients and metadata
   *
   * @example
   * ```typescript
   * const docWithRecipients = await TurboSign.getDocumentWithRecipients(documentId);
   * console.log(docWithRecipients.recipients[0].metadata?.color);
   * ```
   */
  static async getDocumentWithRecipients(documentId: string): Promise<DocumentWithRecipients> {
    const client = this.getClient();
    const response = await client.get<{ data: DocumentWithRecipients }>(
      `/turbosign/documents/${documentId}/with-recipients`
    );
    return response.data;
  }

  /**
   * Get document file as Blob and Uint8Array
   *
   * @param documentId - ID of the document
   * @returns Document file as blob and uint8array
   *
   * @example
   * ```typescript
   * const file = await TurboSign.getDocumentFile(documentId);
   * // Use file.fileAsBlob or file.fileAsUint8Array
   * ```
   */
  static async getDocumentFile(documentId: string): Promise<DocumentFileResponse> {
    const client = this.getClient();
    const response = await client.get<ArrayBuffer>(`/turbosign/documents/${documentId}/file`);
    const arrayBuffer = response as unknown as ArrayBuffer;
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });

    return {
      fileAsBlob: blob,
      fileAsUint8Array: uint8Array,
    };
  }

  /**
   * Get all fields for a document (authenticated endpoint for document owner/QA)
   *
   * @param documentId - ID of the document
   * @returns Array of fields with recipient information
   *
   * @example
   * ```typescript
   * const fields = await TurboSign.getDocumentFields(documentId);
   * fields.forEach(field => console.log(field.type, field.recipient?.name));
   * ```
   */
  static async getDocumentFields(documentId: string): Promise<DocumentFieldResponse[]> {
    const client = this.getClient();
    const response = await client.get<{ data: DocumentFieldResponse[] }>(
      `/turbosign/documents/${documentId}/fields`
    );
    return response.data;
  }

  /**
   * Get all signature documents for the organization dashboard
   *
   * @returns Array of signature documents with recipients
   *
   * @example
   * ```typescript
   * const { documents } = await TurboSign.getSignatureDocuments();
   * documents.forEach(doc => console.log(doc.name, doc.status));
   * ```
   */
  static async getSignatureDocuments(): Promise<{ documents: SignatureDocumentListItem[] }> {
    const client = this.getClient();
    const response = await client.get<{ data: { documents: SignatureDocumentListItem[] } }>(
      '/turbosign/documents/signature-documents'
    );
    return response.data;
  }

  /**
   * Download the public key for a document
   *
   * @param documentId - ID of the document
   * @returns Public key as string
   *
   * @example
   * ```typescript
   * const publicKey = await TurboSign.downloadDocumentPublicKey(documentId);
   * console.log(publicKey);
   * ```
   */
  static async downloadDocumentPublicKey(documentId: string): Promise<string> {
    const client = this.getClient();
    const response = await client.get<string>(
      `/turbosign/documents/${documentId}/public-key/download`
    );
    return response;
  }

  /**
   * Save document details with recipients (combines document update and recipient management)
   *
   * @param documentId - ID of the document
   * @param documentData - Document name and description
   * @param recipients - Recipients to add to the document
   * @returns Updated document with recipients
   *
   * @example
   * ```typescript
   * const result = await TurboSign.saveDocumentDetails(
   *   documentId,
   *   { name: 'Updated Contract', description: 'Q4 2024' },
   *   [{ email: 'john@example.com', name: 'John Doe', signingOrder: 1 }]
   * );
   * ```
   */
  static async saveDocumentDetails(
    documentId: string,
    documentData: { name?: string; description?: string },
    recipients: Array<{
      name: string;
      email: string;
      signingOrder: number;
      metadata?: { color?: string; lightColor?: string };
    }>
  ): Promise<DocumentWithRecipients> {
    const client = this.getClient();
    const response = await client.post<{ data: DocumentWithRecipients }>(
      `/turbosign/documents/${documentId}/update-with-recipients`,
      { document: documentData, recipients }
    );
    return response.data;
  }

  // ============================================
  // PUBLIC ENDPOINTS (for recipient signing)
  // ============================================

  /**
   * Get document file using recipient token (public endpoint)
   *
   * @param documentId - ID of the document
   * @param recipientToken - Token for the recipient
   * @returns Document file as blob and uint8array
   *
   * @example
   * ```typescript
   * const file = await TurboSign.getDocumentFileWithRecipientToken(documentId, token);
   * ```
   */
  static async getDocumentFileWithRecipientToken(
    documentId: string,
    recipientToken: string
  ): Promise<DocumentFileResponse> {
    const client = this.getClient();
    const response = await client.get<ArrayBuffer>(
      `/turbosign/public/documents/${documentId}/file?recipientToken=${recipientToken}`
    );
    const arrayBuffer = response as unknown as ArrayBuffer;
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });

    return {
      fileAsBlob: blob,
      fileAsUint8Array: uint8Array,
    };
  }

  /**
   * Get fields for a recipient to sign using recipient token (public endpoint)
   *
   * @param documentId - ID of the document
   * @param recipientToken - Token for the recipient
   * @returns Array of fields to be signed
   *
   * @example
   * ```typescript
   * const fields = await TurboSign.getRecipientFieldsWithToken(documentId, token);
   * ```
   */
  static async getRecipientFieldsWithToken(
    documentId: string,
    recipientToken: string
  ): Promise<RecipientFieldResponse[]> {
    const client = this.getClient();
    const response = await client.get<{ data: RecipientFieldResponse[] }>(
      `/turbosign/public/documents/${documentId}/fields/recipient?recipientToken=${recipientToken}`
    );
    return response.data;
  }

  /**
   * Record user consent to terms of service (public endpoint)
   *
   * @param documentId - ID of the document
   * @param recipientToken - Token for the recipient
   * @returns Success status
   *
   * @example
   * ```typescript
   * await TurboSign.recordTermsOfServiceConsent(documentId, token);
   * ```
   */
  static async recordTermsOfServiceConsent(
    documentId: string,
    recipientToken: string
  ): Promise<{ success: boolean }> {
    const client = this.getClient();
    const response = await client.post<{ data: { success: boolean } }>(
      `/turbosign/public/documents/${documentId}/consent?recipientToken=${recipientToken}`,
      {}
    );
    return response.data;
  }

  /**
   * Submit a signed document with field values using recipient token (public endpoint)
   *
   * @param documentId - ID of the document
   * @param recipientToken - Token for the recipient
   * @param fieldValues - Field values to submit
   * @returns Submission response
   *
   * @example
   * ```typescript
   * const result = await TurboSign.submitSignedDocumentWithToken(
   *   documentId,
   *   token,
   *   [
   *     { fieldId: 'field-1', value: 'signature-data-url', isTextSignature: false },
   *     { fieldId: 'field-2', value: 'John Doe', isTextSignature: true, fontFamily: 'Arial' }
   *   ]
   * );
   * ```
   */
  static async submitSignedDocumentWithToken(
    documentId: string,
    recipientToken: string,
    fieldValues?: Array<{
      fieldId: string;
      value: string;
      isTextSignature?: boolean;
      fontFamily?: string;
    }>
  ): Promise<SubmitSignedDocumentResponse> {
    const client = this.getClient();
    const response = await client.post<SubmitSignedDocumentResponse>(
      `/turbosign/public/documents/${documentId}/sign?recipientToken=${recipientToken}`,
      fieldValues || []
    );
    return response;
  }

  /**
   * Get public document status using recipient token (public endpoint)
   *
   * @param documentId - ID of the document
   * @param recipientToken - Token for the recipient
   * @returns Document status and signability
   *
   * @example
   * ```typescript
   * const status = await TurboSign.getPublicDocumentStatus(documentId, token);
   * if (!status.isSignable) {
   *   console.error(status.error);
   * }
   * ```
   */
  static async getPublicDocumentStatus(
    documentId: string,
    recipientToken: string
  ): Promise<PublicDocumentStatusResponse> {
    const client = this.getClient();
    const response = await client.get<{ data: { status: string } }>(
      `/turbosign/public/documents/${documentId}/status?recipientToken=${recipientToken}`
    );

    const status = response.data.status;
    const isSignable = status !== 'completed' && status !== 'voided';

    let error: string | undefined;
    if (status === 'completed') {
      error = 'This document has already been completed and cannot be signed again.';
    } else if (status === 'voided') {
      error = 'This document has been voided and is no longer valid for signing.';
    }

    return {
      status,
      isSignable,
      error,
    };
  }
}
