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
  | 'email';

export interface SignatureField {
  /** Type of signature field */
  type: SignatureFieldType;
  /** ID of the recipient this field is assigned to */
  recipientId: string;
  /** Page number (1-indexed) */
  page: number;
  /** X coordinate position on the page */
  x: number;
  /** Y coordinate position on the page */
  y: number;
  /** Width of the field in points (required for coordinate-based fields) */
  width: number;
  /** Height of the field in points (required for coordinate-based fields) */
  height: number;
  /** Page width in points (required for coordinate-based fields) */
  pageWidth: number;
  /** Page height in points (required for coordinate-based fields) */
  pageHeight: number;
  /** Default value for the field */
  defaultValue?: string;
  /** Whether this is a multiline text field */
  isMultiline?: boolean;
  /** Whether this field is required */
  required?: boolean;
  /** Label for the field */
  label?: string;
}

export interface TemplateField {
  /** Template field name/identifier */
  name: string;
  /** Type of signature field */
  type: SignatureFieldType;
  /** ID of the recipient this field is assigned to */
  recipientId: string;
  /** Whether this field is required */
  required?: boolean;
}

export interface Recipient {
  /** Recipient's email address */
  email: string;
  /** Recipient's full name */
  name: string;
  /** Signing order (optional, for sequential signing) */
  order?: number;
  /** Custom message for this recipient */
  message?: string;
}

export interface RecipientResponse extends Recipient {
  /** Unique ID for this recipient */
  id: string;
  /** Current status of the recipient */
  status: 'pending' | 'completed' | 'declined';
  /** URL for the recipient to sign the document */
  signUrl?: string;
  /** Date when the recipient signed (if completed) */
  signedAt?: string;
}

export interface UploadDocumentResponse {
  /** Unique document ID */
  documentId: string;
  /** Document name */
  name: string;
  /** Number of pages in the document */
  pageCount: number;
  /** Document status */
  status: string;
}

export interface AddRecipientsRequest {
  /** List of recipients */
  recipients: Recipient[];
}

export interface AddRecipientsResponse {
  /** Document ID */
  documentId: string;
  /** List of recipients with their IDs and sign URLs */
  recipients: RecipientResponse[];
}

export interface PrepareSigningRequest {
  /** List of signature fields to place on the document */
  fields: SignatureField[] | TemplateField[];
  /** Webhook URL to receive signature completion events */
  webhookUrl?: string;
  /** Custom message to all signers */
  message?: string;
  /** Whether to send email notifications immediately */
  sendEmails?: boolean;
}

export interface PrepareSigningResponse {
  /** Document ID */
  documentId: string;
  /** Status of the document */
  status: 'prepared' | 'sent';
  /** List of recipients with their sign URLs */
  recipients: RecipientResponse[];
  /** When the document was prepared */
  preparedAt: string;
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

export interface RecipientMetadata {
  /** UI color for recipient */
  color?: string;
  /** Light variant color */
  lightColor?: string;
}

export interface DocumentWithRecipients {
  /** Document details */
  document: {
    id: string;
    name: string;
    description: string;
    pdfFileId?: string;
    status: DocumentStatusResponse['status'];
    createdOn: string;
    accessToken?: string;
  };
  /** Recipients with metadata */
  recipients: Array<{
    id?: string;
    documentId?: string;
    name: string;
    email: string;
    signingOrder: number;
    status?: string;
    accessToken?: string;
    signedOn?: Date;
    metadata?: RecipientMetadata;
  }>;
  /** Optional description */
  description?: string;
}

export interface DocumentFileResponse {
  /** File as Blob */
  fileAsBlob: Blob;
  /** File as Uint8Array */
  fileAsUint8Array: Uint8Array;
}

export interface DocumentFieldResponse {
  id: string;
  type: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
  recipientId: string;
  value?: string;
  templateData?: any;
  calculatedFromTemplate?: boolean;
  recipient?: {
    name: string;
    email: string;
    metadata?: RecipientMetadata;
  };
}

export interface SignatureDocumentListItem {
  id: string;
  name: string;
  description: string;
  status: DocumentStatusResponse['status'];
  pdfFileId: string;
  createdBy: string;
  createdOn: string;
  updatedOn: string;
  recipients: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    signingOrder: number;
  }>;
  metadata?: {
    senderName?: string;
  };
}

export interface RecipientFieldResponse {
  id: string;
  type: string;
  page: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  pageWidth: number;
  pageHeight: number;
  defaultValue?: string;
  value?: string | null;
  isMultiline?: boolean;
}

export interface SubmitSignedDocumentResponse {
  message: string;
  isFreePlan: boolean;
}

export interface PublicDocumentStatusResponse {
  status: string;
  isSignable: boolean;
  error?: string;
}
