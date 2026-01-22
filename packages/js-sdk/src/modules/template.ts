/**
 * TurboTemplate Module - Advanced document templating with Angular-like expressions
 */

import { HttpClient, HttpClientConfig } from '../http';
import {
  TemplateVariable,
  GenerateTemplateRequest,
  GenerateTemplateResponse,
  VariableValidation,
  SimpleVariable,
  NestedVariable,
  LoopVariable,
  ConditionalVariable,
  ImageVariable,
} from '../types/template';

export class TurboTemplate {
  private static client: HttpClient;

  /**
   * Configure the TurboTemplate module with API credentials
   *
   * @param config - Configuration object
   * @param config.apiKey - TurboDocx API key (required)
   * @param config.orgId - Organization ID (required)
   * @param config.baseUrl - API base URL (optional, defaults to https://api.turbodocx.com)
   *
   * @example
   * ```typescript
   * TurboTemplate.configure({
   *   apiKey: process.env.TURBODOCX_API_KEY,
   *   orgId: process.env.TURBODOCX_ORG_ID
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

  /**
   * Generate a document from a template with variables
   *
   * Supports advanced templating features:
   * - Simple variable substitution: {customer_name}
   * - Nested objects: {user.firstName}
   * - Loops: {#products}...{/products}
   * - Conditionals: {#if condition}...{/if}
   * - Expressions: {price + tax}
   * - Filters: {name | uppercase}
   *
   * @param request - Template ID and variables
   * @returns Generated document
   *
   * @example
   * ```typescript
   * // Simple variable substitution
   * const result = await TurboTemplate.generate({
   *   templateId: 'template-uuid',
   *   variables: [
   *     { placeholder: '{customer_name}', mimeType: 'text', value: 'John Doe' },
   *     { placeholder: '{order_total}', mimeType: 'text', value: 1500 }
   *   ]
   * });
   *
   * // Advanced: nested objects with dot notation
   * const result = await TurboTemplate.generate({
   *   templateId: 'template-uuid',
   *   variables: [
   *     {
   *       placeholder: '{user}',
   *       mimeType: 'json',
   *       value: {
   *         firstName: 'John',
   *         email: 'john@example.com'
   *       }
   *     }
   *   ]
   * });
   * // Template can use: {user.firstName}, {user.email}
   *
   * // Advanced: loops with arrays
   * const result = await TurboTemplate.generate({
   *   templateId: 'template-uuid',
   *   variables: [
   *     {
   *       placeholder: '{products}',
   *       mimeType: 'json',
   *       value: [
   *         { name: 'Laptop', price: 999 },
   *         { name: 'Mouse', price: 29 }
   *       ]
   *     }
   *   ]
   * });
   * // Template can use: {#products}{name}: ${price}{/products}
   *
   * // Advanced: expressions with calculations
   * const result = await TurboTemplate.generate({
   *   templateId: 'template-uuid',
   *   variables: [
   *     { placeholder: '{price}', mimeType: 'text', value: '100', usesAdvancedTemplatingEngine: true },
   *     { placeholder: '{tax}', mimeType: 'text', value: '15', usesAdvancedTemplatingEngine: true }
   *   ]
   * });
   * // Template can use: {price + tax}, {price * 1.15}
   * ```
   */
  static async generate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
    const client = this.getClient();

    // Prepare request body - send as JSON
    const body: any = {
      templateId: request.templateId,
      variables: request.variables.map((v) => {
        const variable: any = {
          placeholder: v.placeholder,
          name: v.name,
        };

        // mimeType is required
        if (!v.mimeType) {
          throw new Error(`Variable "${variable.placeholder}" must have a 'mimeType' property`);
        }
        variable.mimeType = v.mimeType;

        // Handle value - keep objects/arrays as-is for JSON serialization
        if (v.value !== undefined && v.value !== null) {
          variable.value = v.value;
        } else if (v.text !== undefined && v.text !== null) {
          variable.text = v.text;
        } else {
          throw new Error(`Variable "${variable.placeholder}" must have either 'value' or 'text' property`);
        }

        // Add advanced templating flags if specified
        if (v.usesAdvancedTemplatingEngine != null) {
          variable.usesAdvancedTemplatingEngine = v.usesAdvancedTemplatingEngine;
        }
        if (v.nestedInAdvancedTemplatingEngine != null) {
          variable.nestedInAdvancedTemplatingEngine = v.nestedInAdvancedTemplatingEngine;
        }
        if (v.allowRichTextInjection != null) {
          variable.allowRichTextInjection = v.allowRichTextInjection;
        }

        // Add optional fields
        if (v.description) variable.description = v.description;
        if (v.defaultValue !== undefined) variable.defaultValue = v.defaultValue;
        if (v.nestedVariables) variable.nestedVariables = v.nestedVariables;
        if (v.subvariables) variable.subvariables = v.subvariables;

        return variable;
      }),
    };

    // Add optional request parameters
    if (request.name) body.name = request.name;
    if (request.description) body.description = request.description;
    if (request.replaceFonts !== undefined) body.replaceFonts = request.replaceFonts;
    if (request.defaultFont) body.defaultFont = request.defaultFont;
    if (request.outputFormat) body.outputFormat = request.outputFormat;
    if (request.metadata) body.metadata = request.metadata;

    const response = await client.post<GenerateTemplateResponse>('/v1/deliverable', body);
    return response;
  }

  /**
   * Validate a variable configuration
   *
   * Checks if a variable is properly configured for advanced templating
   *
   * @param variable - Variable to validate
   * @returns Validation result
   */
  static validateVariable(variable: TemplateVariable): VariableValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check placeholder/name
    if (!variable.placeholder && !variable.name) {
      errors.push('Variable must have either "placeholder" or "name" property');
    }

    // Check value/text
    const hasValue = variable.value !== undefined && variable.value !== null;
    const hasText = variable.text !== undefined && variable.text !== null;

    if (!hasValue && !hasText) {
      errors.push('Variable must have either "value" or "text" property');
    }

    // Check advanced templating settings
    if (variable.mimeType === 'json' || (typeof variable.value === 'object' && variable.value !== null)) {
      if (!variable.mimeType) {
        warnings.push('Complex objects should explicitly set mimeType to "json"');
      }
    }

    // Check for arrays
    if (Array.isArray(variable.value)) {
      if (variable.mimeType !== 'json') {
        warnings.push('Array values should use mimeType: "json"');
      }
    }

    // Check image variables
    if (variable.mimeType === 'image') {
      if (typeof variable.value !== 'string') {
        errors.push('Image variables must have a string value (URL or base64)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Helper: Create a simple text variable
   * @param name - Variable name
   * @param value - Variable value
   * @param placeholder - Optional custom placeholder (defaults to {name})
   */
  static createSimpleVariable(name: string, value: string | number | boolean, placeholder?: string): SimpleVariable {
    const p = placeholder ?? (name.startsWith('{') ? name : `{${name}}`);
    return {
      placeholder: p,
      name,
      value,
      mimeType: 'text',
    };
  }

  /**
   * Helper: Create a nested object variable
   * @param name - Variable name
   * @param value - Object value
   * @param placeholder - Optional custom placeholder (defaults to {name})
   */
  static createNestedVariable(name: string, value: Record<string, any>, placeholder?: string): NestedVariable {
    const p = placeholder ?? (name.startsWith('{') ? name : `{${name}}`);
    return {
      placeholder: p,
      name,
      value,
      usesAdvancedTemplatingEngine: true,
      mimeType: 'json',
    };
  }

  /**
   * Helper: Create a loop/array variable
   * @param name - Variable name
   * @param value - Array value
   * @param placeholder - Optional custom placeholder (defaults to {name})
   */
  static createLoopVariable(name: string, value: any[], placeholder?: string): LoopVariable {
    const p = placeholder ?? (name.startsWith('{') ? name : `{${name}}`);
    return {
      placeholder: p,
      name,
      value,
      usesAdvancedTemplatingEngine: true,
      mimeType: 'json',
    };
  }

  /**
   * Helper: Create a conditional variable
   * @param name - Variable name
   * @param value - Conditional value
   * @param placeholder - Optional custom placeholder (defaults to {name})
   */
  static createConditionalVariable(name: string, value: any, placeholder?: string): ConditionalVariable {
    const p = placeholder ?? (name.startsWith('{') ? name : `{${name}}`);
    return {
      placeholder: p,
      name,
      value,
      mimeType: 'json',
      usesAdvancedTemplatingEngine: true,
    };
  }

  /**
   * Helper: Create an image variable
   * @param name - Variable name
   * @param imageUrl - Image URL or base64 string
   * @param placeholder - Optional custom placeholder (defaults to {name})
   */
  static createImageVariable(name: string, imageUrl: string, placeholder?: string): ImageVariable {
    const p = placeholder ?? (name.startsWith('{') ? name : `{${name}}`);
    return {
      placeholder: p,
      name,
      value: imageUrl,
      mimeType: 'image',
    };
  }
}
