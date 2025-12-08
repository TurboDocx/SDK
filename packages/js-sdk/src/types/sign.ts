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
  /** Current status of the recipient */
  status: 'pending' | 'completed' | 'declined';
  /** URL for the recipient to sign the document */
  signUrl?: string;
  /** Date when the recipient signed (if completed) */
  signedAt?: string;
}

export interface VoidDocumentResponse {
  /** Document ID */
  documentId: string;
  /** New status after voiding */
  status: 'voided';
  /** When the document was voided */
  voidedAt: string;
}

export interface ResendEmailResponse {
  /** Document ID */
  documentId: string;
  /** Status message */
  message: string;
  /** When the email was resent */
  resentAt: string;
}

export interface AuditTrailEntry {
  /** Event type */
  event: string;
  /** Actor who performed the action */
  actor: string;
  /** Timestamp of the event */
  timestamp: string;
  /** IP address of the actor */
  ipAddress?: string;
  /** Additional details */
  details?: Record<string, any>;
}

export interface AuditTrailResponse {
  /** Document ID */
  documentId: string;
  /** List of audit trail entries */
  entries: AuditTrailEntry[];
}

export interface DocumentStatusResponse {
  /** Document ID */
  documentId: string;
  /** Current document status */
  status: 'draft' | 'setup_complete' | 'review_ready' | 'under_review' | 'completed' | 'voided';
  /** Document name */
  name: string;
  /** List of recipients and their status */
  recipients: RecipientResponse[];
  /** When the document was created */
  createdAt: string;
  /** When the document was last updated */
  updatedAt: string;
  /** When the document was completed (if applicable) */
  completedAt?: string;
}

// ============================================
// SINGLE-STEP OPERATION TYPES
// ============================================

/**
 * Field configuration for single-step operations
 * Supports both coordinate-based and template anchor-based positioning
 */
export interface N8nField {
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
export interface N8nRecipient {
  /** Recipient's full name */
  name: string;
  /** Recipient's email address */
  email: string;
  /** Signing order (1-indexed) */
  signingOrder: number;
}

/**
 * Request for prepareForReview - prepare document without sending emails
 */
export interface PrepareForReviewRequest {
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
  recipients: N8nRecipient[];
  /** Signature fields configuration */
  fields: N8nField[];
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
}

/**
 * Response from prepareForReview
 */
export interface PrepareForReviewResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Document ID */
  documentId: string;
  /** Document status */
  status: string;
  /** Preview URL for reviewing the document */
  previewUrl?: string;
  /** Recipients with their status */
  recipients?: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
  }>;
  /** Response message */
  message: string;
}

/**
 * Request for prepareForSigningSingle - prepare and send in single call
 */
export interface PrepareForSigningSingleRequest {
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
  recipients: N8nRecipient[];
  /** Signature fields configuration */
  fields: N8nField[];
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
}

/**
 * Response from prepareForSigningSingle
 */
export interface PrepareForSigningSingleResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Document ID */
  documentId: string;
  /** Response message */
  message: string;
}
