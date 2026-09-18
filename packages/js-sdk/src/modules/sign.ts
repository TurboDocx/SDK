/**
 * TurboSign Module - Digital signature operations
 */

import { HttpClient, HttpClientConfig } from '../http';
import { NetworkError, ValidationError } from '../utils/errors';
import {
  VoidDocumentResponse,
  ResendEmailResponse,
  AuditTrailResponse,
  DocumentStatusResponse,
  DocumentRecipientsResponse,
  CreateSignatureReviewLinkRequest,
  CreateSignatureReviewLinkResponse,
  CreateSigningUrlRequest,
  CreateSigningUrlResponse,
  CreateEmbeddedSignatureRequest,
  CreateEmbeddedSignatureResponse,
  EmbeddedSignatureRecipient,
  EmbeddedSignatureRecipientResult,
  EmbeddedSigningSettings,
  Field,
  IdentityVerification,
  Recipient,
  SendSignatureRequest,
  SendSignatureResponse,
  SignatureFieldType,
  SignatureScheduleOptions,
  SendReminderResponse,
} from '../types/sign';

/**
 * Shorthand field key → the concrete {@link SignatureFieldType} it emits plus its default size.
 *
 * Note `initials` maps to the `'initial'` field type — that is the literal in the
 * {@link SignatureFieldType} union (there is no `'initials'`).
 */
const EMBEDDED_FIELD_SPECS: Record<
  keyof NonNullable<EmbeddedSignatureRecipient['fields']>,
  { type: SignatureFieldType; size: { width: number; height: number } }
> = {
  signature: { type: 'signature', size: { width: 100, height: 30 } },
  date: { type: 'date', size: { width: 75, height: 30 } },
  initials: { type: 'initial', size: { width: 50, height: 30 } },
  fullName: { type: 'full_name', size: { width: 150, height: 30 } },
};

/**
 * Client-side fail-fast validation of each recipient's identityVerification block. The server is
 * the source of truth; this catches the common mistakes early with actionable messages so an
 * integrator sees them at the call site rather than as an HTTP 400.
 */
function validateRecipientsIdentity(recipients: Recipient[] | undefined): void {
  for (const r of recipients ?? []) {
    const iv = r.identityVerification;
    if (!iv) continue;
    if (iv.mode === 'otp') {
      if (iv.channel === 'sms' && !r.phone) {
        throw new ValidationError(`Recipient "${r.email}" uses SMS OTP but has no phone (E.164).`, 'PhoneRequiredForSmsOtp');
      }
    } else if (iv.mode === 'external_idv') {
      if (!iv.provider || !iv.provider.trim()) {
        throw new ValidationError(`Recipient "${r.email}" uses external_idv but has no provider.`, 'IdvProviderRequired');
      }
    } else if (iv.mode === 'override') {
      // Require the literal boolean true (not the string "true") plus a real reason — this is the
      // acknowledgement that the signature will be recorded as not identity-verified.
      if ((iv as { overrideIdentityVerification?: unknown }).overrideIdentityVerification !== true) {
        throw new ValidationError(
          `Recipient "${r.email}" override requires overrideIdentityVerification: true (boolean).`,
          'OverrideNotAcknowledged'
        );
      }
      if (!iv.reason || !iv.reason.trim()) {
        throw new ValidationError(`Recipient "${r.email}" override requires a non-empty reason.`, 'OverrideNotAcknowledged');
      }
    }
  }
}

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
    validateRecipientsIdentity(request.recipients);
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
    validateRecipientsIdentity(request.recipients);
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

    // Forward email suppression when explicitly set. Tested with `!== undefined` (never truthiness),
    // exactly like the schedule overrides below: `false` (do not email) is a meaningful value and a
    // truthiness check would drop it and silently let the backend email the recipients.
    if (request.sendEmail !== undefined) formData.sendEmail = request.sendEmail;

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

  /**
   * Map an embedded recipient's ergonomic `auth` shorthand to a full {@link IdentityVerification}.
   * `emailOtp` wins if both are set. Returns `undefined` when no auth is requested (no verification).
   */
  private static resolveIdentityVerification(
    auth: EmbeddedSignatureRecipient['auth']
  ): IdentityVerification | undefined {
    if (auth?.emailOtp) return { mode: 'otp', channel: 'email' };
    if (auth?.sms) return { mode: 'otp', channel: 'sms' };
    return undefined;
  }

  /**
   * Expand a recipient's `fields` shorthand into full {@link Field} objects — one per provided key,
   * anchored to the given text with `placement: 'replace'` and the key's default size.
   */
  private static expandRecipientFields(
    recipient: EmbeddedSignatureRecipient
  ): Field[] {
    const shorthand = recipient.fields;
    if (!shorthand) return [];
    const fields: Field[] = [];
    for (const key of Object.keys(EMBEDDED_FIELD_SPECS) as Array<keyof typeof EMBEDDED_FIELD_SPECS>) {
      const anchor = shorthand[key];
      if (!anchor) continue;
      const spec = EMBEDDED_FIELD_SPECS[key];
      fields.push({
        type: spec.type,
        recipientEmail: recipient.email,
        template: { anchor, placement: 'replace', size: spec.size },
      });
    }
    return fields;
  }

  /**
   * Create a signature request AND mint a per-recipient embedded signing URL in ONE call — the
   * embedded-signing counterpart of DocuSeal's create-with-embed and Dropbox Sign's embedded flow.
   * Scales to multiple signers (e.g. in-person, same-device sequential signing): you get one embed
   * URL per recipient, returned in signing order.
   *
   * This is a thin WRAPPER over {@link TurboSign.sendSignature} + {@link TurboSign.createSigningUrl}
   * — no new endpoint. It maps the ergonomic request (per-recipient `auth` + `fields` shorthand)
   * onto those calls, then assembles a per-recipient result carrying the embed URL and the resolved
   * identity-verification mode.
   *
   * Mapping:
   * - `auth.emailOtp` → identityVerification `{ mode:'otp', channel:'email' }`;
   *   `auth.sms.phoneNumber` → `{ mode:'otp', channel:'sms' }` and sets the recipient's `phone`.
   * - `fields` shorthand → {@link Field}[] (`placement:'replace'` + a default size). Provide the
   *   top-level `fields` to override the shorthand with full field control.
   * - `signingOrder` defaults to each recipient's array index + 1.
   * - `sendEmail` defaults to `false` (you own the UX; forwarded to the backend).
   * - `returnUrl` is passed through to each embed URL only when provided (https, enforced by
   *   {@link TurboSign.createSigningUrl}).
   *
   * Turn-aware: with a real (sequential) signing order the backend will only mint a URL for the
   * signer whose turn it is. Rather than throw the whole call away, each result carries a `status`:
   * - `'ready'` — it's their turn; `embedUrl` is set, frame it now.
   * - `'pending'` — an earlier signer hasn't finished; `embedUrl` is `null`. Re-mint with
   *   {@link TurboSign.createSigningUrl} once earlier signers complete (e.g. an in-person kiosk that
   *   hands the device to the next signer). See the Sequential-kiosk path in `examples/embedded-web-app`.
   * - `'completed'` — they've already signed; `embedUrl` is `null`.
   * A genuine error (anything other than not-in-turn / already-signed) still throws.
   *
   * @example
   * ```typescript
   * const { recipients } = await TurboSign.createEmbeddedSignature({
   *   file: pdfBuffer,
   *   documentName: 'Auto Policy',
   *   recipients: [
   *     { name: 'John Doe', email: 'john@example.com', auth: { emailOtp: true },
   *       fields: { signature: '{signature1}', date: '{date1}' } },
   *   ],
   * });
   * // Open recipients[0].embedUrl in an iframe / new tab.
   * ```
   */
  static async createEmbeddedSignature(
    request: CreateEmbeddedSignatureRequest
  ): Promise<CreateEmbeddedSignatureResponse> {
    // 1. Map the ergonomic recipients onto full Recipient objects (identity + phone + order).
    const mappedRecipients: Recipient[] = request.recipients.map((r, index) => {
      const identityVerification = this.resolveIdentityVerification(r.auth);
      const phone = r.auth?.sms?.phoneNumber ?? r.phone;
      const recipient: Recipient = {
        name: r.name,
        email: r.email,
        signingOrder: r.signingOrder ?? index + 1,
        ...(phone ? { phone } : {}),
        ...(identityVerification ? { identityVerification } : {}),
      };
      return recipient;
    });

    // Full `fields` (when provided) win verbatim; otherwise expand each recipient's shorthand.
    const fields: Field[] =
      request.fields ?? request.recipients.flatMap((r) => this.expandRecipientFields(r));

    const sendRequest: SendSignatureRequest = {
      recipients: mappedRecipients,
      fields,
      // Embedded flow default: suppress recipient emails (the host owns the UX).
      sendEmail: request.sendEmail ?? false,
      ...(request.file ? { file: request.file } : {}),
      ...(request.fileName ? { fileName: request.fileName } : {}),
      ...(request.fileLink ? { fileLink: request.fileLink } : {}),
      ...(request.templateId ? { templateId: request.templateId } : {}),
      ...(request.deliverableId ? { deliverableId: request.deliverableId } : {}),
      ...(request.documentName ? { documentName: request.documentName } : {}),
      ...(request.documentDescription ? { documentDescription: request.documentDescription } : {}),
      ...(request.senderName ? { senderName: request.senderName } : {}),
      ...(request.senderEmail ? { senderEmail: request.senderEmail } : {}),
      ...(request.ccEmails ? { ccEmails: request.ccEmails } : {}),
    };

    const sent = await this.sendSignature(sendRequest);

    // Match the backend's recipients back to the request by email so we can carry `name` and know
    // the resolved identity mode. The response's `recipients` is optional, so guard it.
    const sentRecipients = sent.recipients ?? [];
    const recipientIdByEmail = new Map(sentRecipients.map((sr) => [sr.email, sr.id]));

    // 2 + 3. Mint one embed URL per recipient and assemble the result IN SIGNING ORDER.
    const ordered = request.recipients
      .map((r, index) => ({ r, order: r.signingOrder ?? index + 1 }))
      .sort((a, b) => a.order - b.order);

    const recipients: EmbeddedSignatureRecipientResult[] = [];
    for (const { r } of ordered) {
      const recipientId = recipientIdByEmail.get(r.email);
      if (!recipientId) {
        throw new ValidationError(
          `sendSignature did not return a recipient matching "${r.email}"; cannot mint an embed URL.`,
          'EmbeddedRecipientNotReturned'
        );
      }
      // Turn-aware: for a real signing order the backend refuses to mint a URL for a signer whose
      // turn hasn't come (`RecipientNotInTurn`) or who already signed (`RecipientAlreadySigned`).
      // Those are expected states, not failures — degrade to a null URL + status so the caller can
      // mint the URL later (when earlier signers finish) instead of the whole call throwing away.
      // Any OTHER error is a genuine failure and propagates.
      try {
        const link = await this.createSigningUrl(sent.documentId, {
          recipientId,
          ...(request.returnUrl ? { returnUrl: request.returnUrl } : {}),
        });
        recipients.push({
          recipientId,
          name: r.name,
          email: r.email,
          embedUrl: link.url,
          status: 'ready',
          identityVerificationMode: link.identityVerificationMode,
        });
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (code !== 'RecipientNotInTurn' && code !== 'NotSignersTurn' && code !== 'RecipientAlreadySigned') {
          throw err;
        }
        recipients.push({
          recipientId,
          name: r.name,
          email: r.email,
          embedUrl: null,
          status: code === 'RecipientAlreadySigned' ? 'completed' : 'pending',
          identityVerificationMode: this.resolveIdentityVerification(r.auth)?.mode ?? null,
        });
      }
    }

    return { documentId: sent.documentId, recipients };
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
   * Mint a single-use embedded signing URL for one recipient — request it the moment the signer is
   * ready (never store it). The counterpart of DocuSign's createRecipientView / BoldSign's
   * GetEmbeddedSignLink. Open the returned `url` in a new tab or redirect to it.
   *
   * @param documentId - the document the recipient belongs to
   * @param request - exactly one of `recipientId` / `externalId`; `identityAssertion` only for
   *   external_idv recipients; optional https `returnUrl`
   *
   * @example
   * ```typescript
   * // OTP or override recipient:
   * const { url, pendingChecks } = await TurboSign.createSigningUrl(documentId, {
   *   externalId: 'baers_customer_123',
   * });
   *
   * // external_idv recipient — pass the assertion from your own identity provider:
   * const { url } = await TurboSign.createSigningUrl(documentId, {
   *   recipientId,
   *   identityAssertion: { provider: 'CAPA', verificationId, verifiedAt, subjectEmail },
   * });
   * ```
   */
  static async createSigningUrl(
    documentId: string,
    request: CreateSigningUrlRequest
  ): Promise<CreateSigningUrlResponse> {
    // Fail fast with actionable messages; the server still enforces everything.
    const selectorCount = [request.recipientId, request.externalId].filter((v) => v !== undefined && v !== '').length;
    if (selectorCount !== 1) {
      throw new ValidationError(
        'Provide exactly one of recipientId or externalId to createSigningUrl.',
        'RecipientSelectorInvalid'
      );
    }
    if (request.returnUrl && !/^https:\/\//i.test(request.returnUrl)) {
      throw new ValidationError('returnUrl must be an https URL.', 'InvalidReturnUrl');
    }
    const client = this.getClient();
    // The endpoint replies { data: { results } }. The client strips the outer `data`, so unwrap the
    // `results` envelope here (same convention as the quote/deliverable modules).
    const response = await client.post<{ results: CreateSigningUrlResponse }>(
      `/turbosign/documents/${documentId}/signing-url`,
      request
    );
    return response.results;
  }

  /**
   * Read the org's embedded-signing settings: the set-once, org-wide gates (embedded signing
   * enabled, external identity verification allowed, override allowed), the default OTP channel,
   * and the allowed iframe embedding origins. Use it to see what is permitted before you request
   * signing URLs.
   *
   * Read-only. Change these in the E-Signature settings (Identity and embedding tab) or via the
   * organization preferences API, where the change is recorded in the settings audit trail.
   *
   * @example
   * ```typescript
   * const settings = await TurboSign.getEmbeddedSigningSettings();
   * if (!settings.enabled) throw new Error('Embedded signing is not enabled for this org.');
   * ```
   */
  static async getEmbeddedSigningSettings(): Promise<EmbeddedSigningSettings> {
    const client = this.getClient();
    // { data: { results } } envelope, same as createSigningUrl above.
    const response = await client.get<{ results: EmbeddedSigningSettings }>(
      '/turbosign/embedded-signing-settings'
    );
    return response.results;
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

  /**
   * Get every recipient on a document with their signing status
   *
   * Answers "who has signed and who are we still waiting on" in one call, and reports who
   * sent the document. `summary` carries the counts, including `waitingOn`.
   *
   * Branch on `effectiveStatus`, not `status`: `status` is the raw database value and is
   * only ever 'pending' | 'viewed' | 'completed', so on a voided or expired document an
   * unsigned signer still reads 'pending' there. `effectiveStatus` layers the document's
   * outcome on top, adding 'voided' and 'expired'.
   *
   * @example
   * ```typescript
   * const { recipients, summary, document } = await TurboSign.getRecipients(documentId);
   * console.log(`${summary.completed}/${summary.total} signed, sent by ${document.sentBy.name}`);
   * console.log(`still waiting on ${summary.waitingOn}`);
   * const chasing = recipients.filter(
   *   (r) => r.effectiveStatus === 'pending' || r.effectiveStatus === 'viewed',
   * );
   * ```
   */
  static async getRecipients(documentId: string): Promise<DocumentRecipientsResponse> {
    const client = this.getClient();
    // HTTP client auto-unwraps {data: ...} responses
    return client.get<DocumentRecipientsResponse>(`/turbosign/documents/${documentId}/recipients`);
  }
}
