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
  /** Current document status */
  status: string;
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
  recipients?: Array<{
    id: string;
    name: string;
    email: string;
    metadata?: Record<string, any>;
  }>;
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
}

/**
 * Response from sendSignature
 */
export interface SendSignatureResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Document ID */
  documentId: string;
  /** Response message */
  message: string;
}
