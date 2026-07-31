/**
 * TurboSign Module - Digital signature operations
 */

import { HttpClient, HttpClientConfig } from '../http';
import { NetworkError } from '../utils/errors';
import {
  VoidDocumentResponse,
  ResendEmailResponse,
  AuditTrailResponse,
  DocumentStatusResponse,
  CreateSignatureReviewLinkRequest,
  CreateSignatureReviewLinkResponse,
  SendSignatureRequest,
  SendSignatureResponse,
  SignatureScheduleOptions,
  SendReminderResponse,
} from '../types/sign';

export class TurboSign {
  private static client: HttpClient;

  /**
   * Configure the TurboSign module with API credentials
   *
   * @param config - Configuration object
   * @param config.apiKey - TurboDocx API key (required)
   * @param config.orgId - Organization ID (required)
   * @param config.senderEmail - Reply-to email address for signature requests (required). Used as the reply-to address on signature request emails and recorded as the sender in the audit trail. The API rejects sends without it.
   * @param config.senderName - Sender name for signature requests (optional). Appears in signature request emails and the audit trail. Defaults to the name of your API key.
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
   * Copies any per-document schedule overrides onto an outgoing request body.
   *
   * Durations are JSON-encoded. `multipart/form-data` has no notion of a nested value — every
   * part arrives as a string — so a `{ value, unit }` object cannot survive the file-upload path
   * as an object. The API decodes a JSON-string duration on BOTH content types, so encoding
   * uniformly keeps one code path for the multipart and JSON branches, exactly as `recipients`
   * and `fields` are already handled.
   *
   * Presence is tested with `!== undefined`, never truthiness: `false` (feature off) and `0`
   * (no reminders / never warn) are all meaningful values, and a truthiness check would drop
   * them and silently fall back to the organization's default — the opposite of what the caller
   * asked for.
   */
  private static applyScheduleOverrides(
    formData: Record<string, any>,
    request: SignatureScheduleOptions
  ): void {
    if (request.remindersEnabled !== undefined) formData.remindersEnabled = request.remindersEnabled;
    if (request.maxReminders !== undefined) formData.maxReminders = request.maxReminders;
    if (request.expirationEnabled !== undefined) formData.expirationEnabled = request.expirationEnabled;

    const durationFields = [
      'reminderDelay',
      'reminderInterval',
      'expireAfter',
      'expirationWarning',
      'expirationWarningInterval',
    ] as const;

    for (const field of durationFields) {
      const duration = request[field];
      if (duration !== undefined) formData[field] = JSON.stringify(duration);
    }
  }

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

    // Per-document reminder + expiration overrides; omitted keys inherit the org defaults.
    this.applyScheduleOverrides(formData, request);

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

    // Per-document reminder + expiration overrides; omitted keys inherit the org defaults.
    this.applyScheduleOverrides(formData, request);

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
   * @returns Voided document details including status and timestamp
   *
   * @example
   * ```typescript
   * const result = await TurboSign.void(documentId, 'Document needs to be revised');
   * console.log(result.status); // "voided"
   * console.log(result.voidedAt); // "2025-01-26T12:00:00.000Z"
   * ```
   */
  static async void(documentId: string, reason: string): Promise<VoidDocumentResponse> {
    const client = this.getClient();
    // HTTP client auto-unwraps {data: ...} responses
    return client.post<VoidDocumentResponse>(
      `/turbosign/documents/${documentId}/void`,
      { reason }
    );
  }

  /**
   * Resend signature request email to recipients
   *
   * @param documentId - ID of the document
   * @param recipientIds - Array of recipient IDs to resend emails to
   * @returns Resend confirmation with success and recipientCount
   *
   * @example
   * ```typescript
   * // Resend to specific recipients
   * const result = await TurboSign.resend(documentId, [recipientId1, recipientId2]);
   * console.log(result.recipientCount); // 2
   * ```
   */
  static async resend(
    documentId: string,
    recipientIds: string[]
  ): Promise<ResendEmailResponse> {
    const client = this.getClient();
    // HTTP client auto-unwraps {data: ...} responses
    return client.post<ResendEmailResponse>(
      `/turbosign/documents/${documentId}/resend-email`,
      { recipientIds }
    );
  }

  /**
   * Get the audit trail for a document
   *
   * @param documentId - ID of the document
   * @returns Audit trail with document info and entries
   *
   * @example
   * ```typescript
   * const audit = await TurboSign.getAuditTrail(documentId);
   * console.log(audit.document.name);
   * for (const entry of audit.auditTrail) {
   *   console.log(`${entry.actionType} - ${entry.timestamp}`);
   * }
   * ```
   */
  static async getAuditTrail(documentId: string): Promise<AuditTrailResponse> {
    const client = this.getClient();
    // HTTP client auto-unwraps {data: ...} responses
    return client.get<AuditTrailResponse>(`/turbosign/documents/${documentId}/audit-trail`);
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
      throw new NetworkError(`Failed to download file: ${fileResponse.statusText}`);
    }

    // Step 3: Return as Blob
    const arrayBuffer = await fileResponse.arrayBuffer();
    return new Blob([arrayBuffer], { type: 'application/pdf' });
  }

  /**
   * Get the status of a document
   *
   * @param documentId - ID of the document
   * @returns Document status
   *
   * @example
   * ```typescript
   * const status = await TurboSign.getStatus(documentId);
   * console.log(status.status); // 'under_review', 'completed', 'voided', etc.
   * ```
   */
  static async getStatus(documentId: string): Promise<DocumentStatusResponse> {
    const client = this.getClient();
    // HTTP client auto-unwraps {data: ...} responses
    return client.get<DocumentStatusResponse>(`/turbosign/documents/${documentId}/status`);
  }

  /**
   * Send a reminder email to a document's outstanding signers
   *
   * This is a **standalone nudge**, deliberately decoupled from the automatic reminder schedule:
   * it ignores the configured cadence, works even when reminders are disabled or the per-signer
   * cap is already spent, and does not consume that cap.
   *
   * Only signers at the CURRENT signing order are emailed. A recipient at a later order (or one
   * who has already signed) is reported back as skipped rather than silently dropped, so the
   * caller can tell that nobody was emailed.
   *
   * @param documentId - ID of the document
   * @param recipientIds - Optional subset to remind. Omit to remind every eligible signer.
   *                       When supplied, the request is all-or-nothing: if any id is not a
   *                       current-order pending signer the API rejects the whole call and sends
   *                       nothing.
   * @returns One result per recipient considered, including why each was skipped
   *
   * @example
   * ```typescript
   * // Nudge whoever's turn it is
   * const { results } = await TurboSign.sendReminder(documentId);
   * for (const r of results) {
   *   console.log(`${r.recipientId}: ${r.status}`); // e.g. "sent", "skipped_wrong_order"
   * }
   *
   * // Nudge one specific signer
   * await TurboSign.sendReminder(documentId, [recipientId]);
   * ```
   */
  static async sendReminder(
    documentId: string,
    recipientIds?: string[]
  ): Promise<SendReminderResponse> {
    const client = this.getClient();

    // Only include the filter when it actually names someone. The API requires at least one id
    // when the key is present, so forwarding an empty array would guarantee a 400 — an empty
    // list is far more likely to mean "no filter" than "remind nobody".
    const body: Record<string, unknown> = {};
    if (recipientIds && recipientIds.length > 0) {
      body.recipientIds = recipientIds;
    }

    // HTTP client auto-unwraps {data: ...} responses
    return client.post<SendReminderResponse>(
      `/turbosign/documents/${documentId}/send-reminder`,
      body
    );
  }
}
