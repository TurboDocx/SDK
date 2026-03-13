/**
 * TypeScript types for Deliverable module
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type VariableMimeType = 'text' | 'html' | 'image' | 'markdown';

export type DeliverableSortColumn = 'createdOn' | 'email' | 'name' | 'updatedOn';

export type SortOrder = 'asc' | 'desc';

// ============================================
// SHARED TYPES
// ============================================

export interface Tag {
  /** Tag unique identifier */
  id: string;
  /** Tag display name */
  label: string;
  /** Whether the tag is active */
  isActive: boolean;
  /** ISO 8601 last update timestamp */
  updatedOn: string;
  /** ISO 8601 creation timestamp */
  createdOn: string;
  /** User ID of the tag creator */
  createdBy: string;
  /** Organization ID the tag belongs to */
  orgId: string;
}

export interface Font {
  /** Font name */
  name: string;
  /** Font usage context (e.g., "body") */
  usage: string;
}

// ============================================
// VARIABLE TYPES
// ============================================

export interface VariableStackEntry {
  /** Content to inject */
  text: string;
  /** Content type */
  mimeType: VariableMimeType;
}

export interface DeliverableVariable {
  /** Template placeholder (e.g., "{CompanyName}") */
  placeholder: string;
  /** Value to inject (not required if variableStack is provided or isDisabled is true) */
  text?: string;
  /** Content type: text, html, image, or markdown */
  mimeType: VariableMimeType;
  /** Skip this variable during generation */
  isDisabled?: boolean;
  /** Nested sub-variables for HTML content with dynamic placeholders */
  subvariables?: DeliverableVariable[];
  /** Multiple instances for repeating content (tables, lists) */
  variableStack?: Record<string, VariableStackEntry> | VariableStackEntry[];
  /** AI prompt for content generation (max 16,000 chars) */
  aiPrompt?: string;
  /** Whether to allow rich text injection */
  allowRichTextInjection?: boolean;
}

// ============================================
// CONFIG
// ============================================

export interface DeliverableConfig {
  /** TurboDocx API key */
  apiKey?: string;
  /** OAuth access token (alternative to apiKey) */
  accessToken?: string;
  /** Organization ID */
  orgId?: string;
  /** API base URL (defaults to https://api.turbodocx.com) */
  baseUrl?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateDeliverableRequest {
  /** Deliverable name (3–255 characters) */
  name: string;
  /** Template ID to generate from */
  templateId: string;
  /** Array of variable objects for substitution */
  variables: DeliverableVariable[];
  /** Description (up to 65,535 characters) */
  description?: string;
  /** Array of tag strings to associate */
  tags?: string[];
}

export interface UpdateDeliverableRequest {
  /** Updated name (3–255 characters) */
  name?: string;
  /** Updated description (up to 65,535 characters) */
  description?: string;
  /** Replace all tags (existing tags are removed first). Pass empty array to remove all. */
  tags?: string[];
}

export interface ListDeliverablesOptions {
  /** Number of results per page (1–100, default 6) */
  limit?: number;
  /** Number of results to skip for pagination (default 0) */
  offset?: number;
  /** Search query to filter by name */
  query?: string;
  /** Include tags in the response */
  showTags?: boolean;
}

export interface GetDeliverableOptions {
  /** Include tags in the response */
  showTags?: boolean;
}

export interface ListDeliverableItemsOptions {
  /** Number of results per page (1–100, default 6) */
  limit?: number;
  /** Number of results to skip for pagination (default 0) */
  offset?: number;
  /** Search query to filter by name */
  query?: string;
  /** Include tags in the response */
  showTags?: boolean;
  /** Filter by tag IDs (all must match — AND logic) */
  selectedTags?: string | string[];
  /** Sort column */
  column0?: DeliverableSortColumn;
  /** Sort direction */
  order0?: SortOrder;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface DeliverableRecord {
  /** Unique deliverable identifier (UUID) */
  id: string;
  /** Deliverable name */
  name: string;
  /** Deliverable description */
  description: string;
  /** Template ID used for generation */
  templateId: string;
  /** Template name */
  templateName?: string;
  /** Whether the source template still exists */
  templateNotDeleted?: boolean;
  /** User ID of the creator */
  createdBy: string;
  /** Email of the creator */
  email?: string;
  /** File size in bytes */
  fileSize?: number;
  /** MIME type of the generated file */
  fileType?: string;
  /** Default font used */
  defaultFont?: string;
  /** Array of font objects with name and usage */
  fonts?: Font[] | null;
  /** Whether the deliverable is active (not deleted) */
  isActive: boolean;
  /** ISO 8601 creation timestamp */
  createdOn: string;
  /** ISO 8601 last update timestamp */
  updatedOn: string;
  /** Parsed variable objects with values (only on getDeliverableDetails) */
  variables?: DeliverableVariable[];
  /** Tags (only when showTags=true) */
  tags?: Tag[];
}

export interface DeliverableListResponse {
  /** Array of deliverable objects */
  results: DeliverableRecord[];
  /** Total number of deliverables matching the query */
  totalRecords: number;
}

export interface CreateDeliverableResponse {
  results: {
    deliverable: DeliverableRecord;
  };
}

export interface UpdateDeliverableResponse {
  /** Success confirmation message */
  message: string;
  /** ID of the updated deliverable */
  deliverableId: string;
}

export interface DeleteDeliverableResponse {
  /** Success confirmation message */
  message: string;
  /** ID of the deleted deliverable */
  deliverableId: string;
}

// ============================================
// DELIVERABLE ITEM TYPES
// ============================================

export interface DeliverableItem {
  /** Item identifier (UUID) */
  id: string;
  /** Item name */
  name: string;
  /** Item description */
  description?: string;
  /** Item type: "deliverable" */
  type: string;
  /** ISO 8601 creation timestamp */
  createdOn: string;
  /** ISO 8601 last update timestamp */
  updatedOn: string;
  /** Active status */
  isActive: boolean;
  /** Creator user ID */
  createdBy: string;
  /** Creator email */
  email?: string;
  /** File size (deliverables only) */
  fileSize?: number;
  /** MIME type (deliverables only) */
  fileType?: string;
  /** Number of deliverables */
  deliverableCount?: number;
  /** Source template exists (deliverables only) */
  templateNotDeleted?: boolean;
  /** Tags (only when showTags=true) */
  tags?: Tag[];
}

export interface DeliverableItemListResponse {
  /** Array of deliverable item objects */
  results: DeliverableItem[];
  /** Total matching items */
  totalRecords: number;
}

export interface DeliverableItemResponse {
  /** The deliverable item object */
  results: DeliverableItem;
  /** Item type */
  type: string;
}
