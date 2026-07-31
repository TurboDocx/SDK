/**
 * TypeScript types for TurboSign module
 */

export type SignatureFieldType =
  | 'signature'
  | 'initial'
  | 'date'
  | 'text'
  | 'full_name'
  | 'title'
  | 'company'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'checkbox';

// ============================================
// RESPONSE TYPES
// ============================================

export interface RecipientResponse {
  /** Unique ID for this recipient */
  id: string;
  /** Recipient's email address */
  email: string;
  /** Recipient's full name */
  name: string;
  /** URL for the recipient to sign the document */
  signUrl?: string;
  /** Date when the recipient signed (if completed) */
  signedAt?: string;
}

/** Recipient in review/send signature responses (id, name, email, metadata) */
export interface ReviewRecipient {
  id: string;
  name: string;
  email: string;
  metadata?: Record<string, unknown>;
}

export interface VoidDocumentResponse {
  /** Document ID */
  id: string;
  /** Document name */
  name: string;
  /** Document status (should be 'voided') */
  status: string;
  /** Reason for voiding */
  voidReason?: string;
  /** Timestamp when document was voided */
  voidedAt?: string;
}

export interface ResendEmailResponse {
  /** Whether the resend was successful */
  success: boolean;
  /** Number of recipients who received email */
  recipientCount: number;
}

export interface AuditTrailUser {
  /** User name */
  name: string;
  /** User email */
  email: string;
}

export interface AuditTrailEntry {
  /** Entry ID */
  id: string;
  /** Document ID */
  documentId: string;
  /** Action type */
  actionType: string;
  /** Timestamp of the event */
  timestamp: string;
  /** Previous hash */
  previousHash?: string;
  /** Current hash */
  currentHash?: string;
  /** Created on timestamp */
  createdOn?: string;
  /** Additional details */
  details?: Record<string, any>;
  /** User who performed the action */
  user?: AuditTrailUser;
  /** User ID */
  userId?: string;
  /** Recipient info */
  recipient?: AuditTrailUser;
  /** Recipient ID */
  recipientId?: string;
}

export interface AuditTrailDocument {
  /** Document ID */
  id: string;
  /** Document name */
  name: string;
}

export interface AuditTrailResponse {
  /** Document info */
  document: AuditTrailDocument;
  /** List of audit trail entries */
  auditTrail: AuditTrailEntry[];
}

export interface DocumentStatusResponse {
  /** Current document status — e.g. 'under_review', 'completed', 'voided', 'expired' */
  status: string;
  /**
   * ISO timestamp when the signing window closes, if the document has a deadline.
   *
   * Absent when expiration is off (the default), which means the document never expires.
   * Once this instant passes the signing links stop working and the document becomes 'expired'.
   */
  expiresAt?: string;
}

// ============================================
// REMINDER + EXPIRATION SCHEDULE
// ============================================

/**
 * A configured length of time.
 *
 * The unit is carried alongside the value rather than normalised away, so "48 hours" stays
 * "48 hours" instead of reading back as "2 days".
 */
export interface Duration {
  /** Whole number of units. Minimum 1, except `expirationWarning` where 0 means "never warn". */
  value: number;
  /** Unit the value is measured in */
  unit: 'hours' | 'days';
}

/**
 * Per-document reminder + expiration overrides.
 *
 * Every field is optional. An omitted field inherits the organization's default; omitting the set
 * entirely means "use the org policy as it stands at send time". Both features are **off** by
 * default, so a document only gets reminders or an expiry if the org enabled them or the caller
 * opts in here.
 *
 * The resolved schedule is frozen onto the document when it is sent, so later changes to the org
 * defaults never alter a document already out for signature.
 */
export interface SignatureScheduleOptions {
  /** Send reminder emails to signers who haven't signed yet */
  remindersEnabled?: boolean;
  /** How long after the invitation before the FIRST reminder */
  reminderDelay?: Duration;
  /** Gap between subsequent reminders */
  reminderInterval?: Duration;
  /** Cap per signer. `-1` means unlimited, `0` means none. Never caps expiry warnings. */
  maxReminders?: number;
  /** Close the signing window after `expireAfter` */
  expirationEnabled?: boolean;
  /** How long the document stays signable, counted from sending */
  expireAfter?: Duration;
  /** How far BEFORE expiry warning emails start. `{ value: 0 }` means no warnings at all. */
  expirationWarning?: Duration;
  /** Gap between warnings once the warning window is open */
  expirationWarningInterval?: Duration;
}

/** Outcome for one recipient of a reminder request */
export type ReminderStatus =
  | 'sent'
  | 'failed'
  | 'skipped_not_due'
  | 'skipped_max_reached'
  | 'skipped_disabled'
  | 'skipped_completed'
  | 'skipped_wrong_order'
  | 'skipped_claim_lost';

export interface ReminderResult {
  /** Recipient this outcome refers to */
  recipientId: string;
  /** What happened for this recipient */
  status: ReminderStatus;
  /** Reminder count after the send (only meaningful when status is 'sent') */
  reminderCount?: number;
  /** Which email was sent — the reminder nudge or the expiry warning */
  phase?: 'reminder' | 'expiring';
}

export interface SendReminderResponse {
  /** One entry per recipient considered, including those skipped and why */
  results: ReminderResult[];
}

// ============================================
// SINGLE-STEP OPERATION TYPES
// ============================================

/**
 * Field configuration for single-step operations
 * Supports both coordinate-based and template anchor-based positioning
 */
export interface Field {
  /** Field type */
  type: SignatureFieldType;
  /** Page number (1-indexed) - required for coordinate-based */
  page?: number;
  /** X coordinate position */
  x?: number;
  /** Y coordinate position */
  y?: number;
  /** Field width in pixels */
  width?: number;
  /** Field height in pixels */
  height?: number;
  /** Recipient email - which recipient fills this field */
  recipientEmail: string;
  /** Default value for the field (for checkbox: "true" or "false") */
  defaultValue?: string;
  /** Whether this is a multiline text field */
  isMultiline?: boolean;
  /** Whether this field is read-only (pre-filled, non-editable) */
  isReadonly?: boolean;
  /** Whether this field is required */
  required?: boolean;
  /** Background color (hex, rgb, or named colors) */
  backgroundColor?: string;
  /** Template anchor configuration for dynamic positioning */
  template?: {
    /** Text anchor pattern like {TagName} */
    anchor?: string;
    /** Alternative: search for any text in document */
    searchText?: string;
    /** Where to place field relative to anchor/searchText */
    placement?: 'replace' | 'before' | 'after' | 'above' | 'below';
    /** Size of the field */
    size?: { width: number; height: number };
    /** Offset from anchor position */
    offset?: { x: number; y: number };
    /** Case sensitive search (default: false) */
    caseSensitive?: boolean;
    /** Use regex for anchor/searchText (default: false) */
    useRegex?: boolean;
  };
}

/**
 * Recipient configuration for single-step operations
 */
export interface Recipient {
  /** Recipient's full name */
  name: string;
  /** Recipient's email address */
  email: string;
  /** Signing order (1-indexed) */
  signingOrder: number;
}

/**
 * Request for createSignatureReviewLink - prepare document without sending emails
 */
export interface CreateSignatureReviewLinkRequest {
  /** PDF file as file path, Buffer, or browser File */
  file?: string | File | Buffer;
  /** Original filename (used when file is a Buffer) */
  fileName?: string;
  /** URL to document file */
  fileLink?: string;
  /** TurboDocx deliverable ID */
  deliverableId?: string;
  /** TurboDocx template ID */
  templateId?: string;
  /** Recipients who will sign */
  recipients: Recipient[];
  /** Signature fields configuration */
  fields: Field[];
  /** Document name */
  documentName?: string;
  /** Document description */
  documentDescription?: string;
  /** Sender name */
  senderName?: string;
  /** Sender email */
  senderEmail?: string;
  /** CC emails (comma-separated or array) */
  ccEmails?: string | string[];
  /**
   * Per-document reminder + expiration overrides. Omit to inherit the organization's defaults.
   * @see SignatureScheduleOptions
   */
  remindersEnabled?: SignatureScheduleOptions['remindersEnabled'];
  reminderDelay?: SignatureScheduleOptions['reminderDelay'];
  reminderInterval?: SignatureScheduleOptions['reminderInterval'];
  maxReminders?: SignatureScheduleOptions['maxReminders'];
  expirationEnabled?: SignatureScheduleOptions['expirationEnabled'];
  expireAfter?: SignatureScheduleOptions['expireAfter'];
  expirationWarning?: SignatureScheduleOptions['expirationWarning'];
  expirationWarningInterval?: SignatureScheduleOptions['expirationWarningInterval'];
}

/**
 * Response from createSignatureReviewLink
 */
export interface CreateSignatureReviewLinkResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Document ID */
  documentId: string;
  /** Document status */
  status: string;
  /** Preview URL for reviewing the document */
  previewUrl?: string;
  /** Recipients with their metadata */
  recipients?: ReviewRecipient[];
  /** Response message */
  message: string;
}

/**
 * Request for sendSignature - prepare and send in single call
 */
export interface SendSignatureRequest {
  /** PDF file as file path, Buffer, or browser File */
  file?: string | File | Buffer;
  /** Original filename (used when file is a Buffer) */
  fileName?: string;
  /** URL to document file */
  fileLink?: string;
  /** TurboDocx deliverable ID */
  deliverableId?: string;
  /** TurboDocx template ID */
  templateId?: string;
  /** Recipients who will sign */
  recipients: Recipient[];
  /** Signature fields configuration */
  fields: Field[];
  /** Document name */
  documentName?: string;
  /** Document description */
  documentDescription?: string;
  /** Sender name */
  senderName?: string;
  /** Sender email */
  senderEmail?: string;
  /** CC emails (comma-separated or array) */
  ccEmails?: string | string[];
  /**
   * Per-document reminder + expiration overrides. Omit to inherit the organization's defaults.
   * @see SignatureScheduleOptions
   */
  remindersEnabled?: SignatureScheduleOptions['remindersEnabled'];
  reminderDelay?: SignatureScheduleOptions['reminderDelay'];
  reminderInterval?: SignatureScheduleOptions['reminderInterval'];
  maxReminders?: SignatureScheduleOptions['maxReminders'];
  expirationEnabled?: SignatureScheduleOptions['expirationEnabled'];
  expireAfter?: SignatureScheduleOptions['expireAfter'];
  expirationWarning?: SignatureScheduleOptions['expirationWarning'];
  expirationWarningInterval?: SignatureScheduleOptions['expirationWarningInterval'];
}

/**
 * Response from sendSignature
 */
export interface SendSignatureResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Document ID */
  documentId: string;
  /** Document status */
  status: string;
  /** Recipients with their metadata */
  recipients?: ReviewRecipient[];
  /** Response message */
  message: string;
}
