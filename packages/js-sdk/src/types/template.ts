/**
 * TypeScript types for TurboTemplate module - Advanced Templating
 */

/**
 * Variable MIME types supported by TurboDocx
 */
export type VariableMimeType = 'text' | 'html' | 'image' | 'markdown' | 'json';

/**
 * Variable configuration for template generation
 * Supports both simple text replacement and advanced templating with Angular-like expressions
 */
export interface TemplateVariable {
  /** Variable name/placeholder (e.g., "customer_name", "order_total") */
  placeholder: string;

  /** Variable name (alternative to placeholder) */
  name: string;

  /**
   * Variable value - can be:
   * - string for simple text
   * - number for numeric values
   * - boolean for conditionals
   * - object for nested data structures
   * - array for loops/iterations
   * - null/undefined for optional values
   */
  value?: string | number | boolean | object | any[] | null;

  /**
   * Text value (legacy, prefer using 'value')
   * Either text OR value must be provided
   */
  text?: string | number | boolean | object | any[] | null;

  /** MIME type of the variable (required) */
  mimeType: VariableMimeType;

  /**
   * Enable advanced templating engine for this variable
   * Allows Angular-like expressions: loops, conditions, etc.
   */
  usesAdvancedTemplatingEngine?: boolean;

  /**
   * Marks variable as nested within an advanced templating context
   * Used for loop iteration variables, nested object properties, etc.
   */
  nestedInAdvancedTemplatingEngine?: boolean;

  /** Allow rich text injection (HTML formatting) */
  allowRichTextInjection?: boolean;

  /** Variable description */
  description?: string;

  /** Whether this is a default value */
  defaultValue?: boolean;

  /** Sub-variables (legacy structure) */
  subvariables?: TemplateVariable[];
}

/**
 * Request for generating a document from template
 */
export interface GenerateTemplateRequest {
  /** Template ID to use for generation */
  templateId: string;

  /** Variables to inject into the template */
  variables: TemplateVariable[];

  /** Document name (required) */
  name: string;

  /** Document description (optional) */
  description?: string;

  /** Replace fonts in the document */
  replaceFonts?: boolean;

  /** Default font to use when replacing */
  defaultFont?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Response from template generation
 *
 * Contains the full deliverable information returned by the API.
 */
export interface GenerateTemplateResponse {
  // Core deliverable fields
  /** Deliverable ID */
  id?: string;

  /** Document name */
  name?: string;

  /** Document description */
  description?: string;

  /** Template ID used for generation */
  templateId?: string;

  /** Projectspace ID */
  projectspaceId?: string;

  /** Folder ID for the deliverable */
  deliverableFolderId?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;

  /** User who created the deliverable */
  createdBy?: string;

  /** Organization ID */
  orgId?: string;

  /** Default font used */
  defaultFont?: string;

  /** Creation timestamp */
  createdOn?: string;

  /** Last update timestamp */
  updatedOn?: string;

  /** Active status flag */
  isActive?: number;

  /** Font information */
  fonts?: any;

  // Response fields
  /** Document download URL */
  downloadUrl?: string;

  /** Response message */
  message?: string;

  /** Error details if generation failed */
  error?: string;

  /** Generated document buffer (if returnBuffer is true) */
  buffer?: Buffer;
}

/**
 * Helper types for common templating patterns
 */

/** Simple key-value variable */
export interface SimpleVariable {
  placeholder: string;
  name: string;
  value: string | number | boolean;
  mimeType: 'text' | 'html';
}

/** Variable with nested structure (e.g., user.name, user.email) */
export interface NestedVariable {
  placeholder: string;
  name: string;
  value: Record<string, any>;
  usesAdvancedTemplatingEngine: true;
  mimeType: 'json';
}

/** Variable for loop iteration (e.g., items array) */
export interface LoopVariable {
  placeholder: string;
  name: string;
  value: any[];
  usesAdvancedTemplatingEngine: true;
  mimeType: 'json';
}

/** Variable with conditional logic */
export interface ConditionalVariable {
  placeholder: string;
  name: string;
  value: any;
  mimeType: 'json';
  usesAdvancedTemplatingEngine: true;
}

/** Image variable */
export interface ImageVariable {
  placeholder: string;
  name: string;
  value: string; // URL or base64
  mimeType: 'image';
}

/**
 * Template context - full data structure for template rendering
 */
export interface TemplateContext {
  /** All variables indexed by placeholder */
  variables: Record<string, any>;

  /** Metadata about the template */
  metadata?: {
    templateId: string;
    templateName?: string;
    version?: string;
  };
}

/**
 * Variable validation result
 */
export interface VariableValidation {
  /** Whether the variable is valid */
  isValid: boolean;

  /** Validation errors */
  errors?: string[];

  /** Validation warnings */
  warnings?: string[];
}

/**
 * Advanced templating features supported
 */
export interface AdvancedTemplatingFeatures {
  /** Support for loops (e.g., {#items}...{/items}) */
  loops: boolean;

  /** Support for conditionals (e.g., {#if condition}...{/if}) */
  conditionals: boolean;

  /** Support for expressions (e.g., {price * quantity}) */
  expressions: boolean;

  /** Support for dot notation (e.g., {user.name}) */
  dotNotation: boolean;

  /** Support for array access (e.g., {items[0]}) */
  arrayAccess: boolean;
}
