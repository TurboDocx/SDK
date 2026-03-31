/**
 * Deliverable Module - Document generation and management operations
 *
 * Provides operations for generating documents from templates,
 * managing deliverables, and downloading files:
 * - generateDeliverable
 * - listDeliverables
 * - getDeliverableDetails
 * - updateDeliverableInfo
 * - deleteDeliverable
 * - downloadSourceFile
 * - downloadPDF
 */

import { HttpClient } from '../http';
import {
  DeliverableConfig,
  CreateDeliverableRequest,
  CreateDeliverableResponse,
  UpdateDeliverableRequest,
  UpdateDeliverableResponse,
  DeleteDeliverableResponse,
  ListDeliverablesOptions,
  GetDeliverableOptions,
  DeliverableListResponse,
  DeliverableRecord,
} from '../types/deliverable';

export class Deliverable {
  private static client: HttpClient;

  /**
   * Configure the Deliverable module with API credentials
   *
   * @param config - Configuration object
   * @param config.apiKey - TurboDocx API key (required)
   * @param config.orgId - Organization ID (required)
   * @param config.baseUrl - API base URL (optional, defaults to https://api.turbodocx.com)
   *
   * @example
   * ```typescript
   * Deliverable.configure({
   *   apiKey: process.env.TURBODOCX_API_KEY,
   *   orgId: process.env.TURBODOCX_ORG_ID,
   * });
   * ```
   */
  static configure(config: DeliverableConfig): void {
    this.client = new HttpClient({
      apiKey: config.apiKey,
      accessToken: config.accessToken,
      orgId: config.orgId,
      baseUrl: config.baseUrl,
      skipSenderValidation: true,
    });
  }

  /**
   * Get the HTTP client instance, throwing if not configured
   */
  private static getClient(): HttpClient {
    if (!this.client) {
      throw new Error(
        'Deliverable not configured. Call Deliverable.configure({ apiKey, orgId }) first.'
      );
    }
    return this.client;
  }

  // ============================================
  // DELIVERABLE CRUD
  // ============================================

  /**
   * List deliverables with pagination, search, and filtering
   *
   * @param options - Query options for filtering, sorting, and pagination
   * @returns Paginated list of deliverables with total count
   *
   * @example
   * ```typescript
   * const { results, totalRecords } = await Deliverable.listDeliverables({
   *   limit: 10,
   *   offset: 0,
   *   showTags: true,
   *   query: 'contract',
   * });
   * console.log(`Found ${totalRecords} deliverables`);
   * ```
   */
  static async listDeliverables(options?: ListDeliverablesOptions): Promise<DeliverableListResponse> {
    const client = this.getClient();
    const params: Record<string, any> = {};

    if (options) {
      if (options.limit !== undefined) params.limit = options.limit;
      if (options.offset !== undefined) params.offset = options.offset;
      if (options.query !== undefined) params.query = options.query;
      if (options.showTags !== undefined) params.showTags = options.showTags;
    }

    return client.get<DeliverableListResponse>('/v1/deliverable', params);
  }

  /**
   * Generate a new deliverable document from a template with variable substitution
   *
   * @param request - Template ID, name, variables, and optional settings
   * @returns The newly created deliverable
   *
   * @example
   * ```typescript
   * const result = await Deliverable.generateDeliverable({
   *   templateId: 'your-template-id',
   *   name: 'Employee Contract - John Smith',
   *   variables: [
   *     { placeholder: '{EmployeeName}', text: 'John Smith', mimeType: 'text' },
   *     { placeholder: '{CompanyName}', text: 'TechCorp Inc.', mimeType: 'text' },
   *   ],
   *   tags: ['hr', 'contract'],
   * });
   * console.log(`Generated: ${result.results.deliverable.id}`);
   * ```
   */
  static async generateDeliverable(request: CreateDeliverableRequest): Promise<CreateDeliverableResponse> {
    const client = this.getClient();
    return client.post<CreateDeliverableResponse>('/v1/deliverable', request);
  }

  /**
   * Get full details of a single deliverable, including variables, fonts, and template info
   *
   * @param id - Deliverable UUID
   * @param options - Optional query parameters
   * @returns Full deliverable details
   *
   * @example
   * ```typescript
   * const deliverable = await Deliverable.getDeliverableDetails(
   *   'deliverable-uuid',
   *   { showTags: true }
   * );
   * console.log(deliverable.name, deliverable.variables);
   * ```
   */
  static async getDeliverableDetails(id: string, options?: GetDeliverableOptions): Promise<DeliverableRecord> {
    const client = this.getClient();
    const params: Record<string, any> = {};
    if (options?.showTags !== undefined) params.showTags = options.showTags;

    const response = await client.get<{ results: DeliverableRecord }>(`/v1/deliverable/${id}`, params);
    return response.results;
  }

  /**
   * Update a deliverable's name, description, or tags
   *
   * Note: When providing tags, all existing tags are replaced.
   * To add a tag, include the full list. To remove all, pass an empty array.
   *
   * @param id - Deliverable UUID
   * @param request - Fields to update (all optional)
   * @returns Success message with deliverable ID
   *
   * @example
   * ```typescript
   * const result = await Deliverable.updateDeliverableInfo(
   *   'deliverable-uuid',
   *   {
   *     name: 'Employee Contract - John Smith (Final)',
   *     tags: ['hr', 'contract', 'finalized'],
   *   }
   * );
   * ```
   */
  static async updateDeliverableInfo(id: string, request: UpdateDeliverableRequest): Promise<UpdateDeliverableResponse> {
    const client = this.getClient();
    return client.patch<UpdateDeliverableResponse>(`/v1/deliverable/${id}`, request);
  }

  /**
   * Soft-delete a deliverable. The deliverable is marked as inactive
   * and will no longer appear in list results, but its data is retained.
   *
   * @param id - Deliverable UUID
   * @returns Success message with deliverable ID
   *
   * @example
   * ```typescript
   * const result = await Deliverable.deleteDeliverable('deliverable-uuid');
   * console.log(result.message); // "Deliverable deleted successfully"
   * ```
   */
  static async deleteDeliverable(id: string): Promise<DeleteDeliverableResponse> {
    const client = this.getClient();
    return client.delete<DeleteDeliverableResponse>(`/v1/deliverable/${id}`);
  }

  // ============================================
  // FILE DOWNLOADS
  // ============================================

  /**
   * Download the original source file (DOCX or PPTX) of a deliverable
   *
   * Requires the `hasFileDownload` feature to be enabled on your organization's license.
   *
   * @param deliverableId - Deliverable UUID
   * @returns Raw file content as ArrayBuffer
   *
   * @example
   * ```typescript
   * // Node.js
   * const buffer = await Deliverable.downloadSourceFile('deliverable-uuid');
   * fs.writeFileSync('contract.docx', Buffer.from(buffer));
   *
   * // Browser
   * const buffer = await Deliverable.downloadSourceFile('deliverable-uuid');
   * const blob = new Blob([buffer]);
   * const url = URL.createObjectURL(blob);
   * ```
   */
  static async downloadSourceFile(deliverableId: string): Promise<ArrayBuffer> {
    const client = this.getClient();
    return client.getRaw(`/v1/deliverable/file/${deliverableId}`);
  }

  /**
   * Download the PDF version of a deliverable
   *
   * @param deliverableId - Deliverable UUID
   * @returns Raw PDF content as ArrayBuffer
   *
   * @example
   * ```typescript
   * // Node.js
   * const buffer = await Deliverable.downloadPDF('deliverable-uuid');
   * fs.writeFileSync('contract.pdf', Buffer.from(buffer));
   *
   * // Browser
   * const buffer = await Deliverable.downloadPDF('deliverable-uuid');
   * const blob = new Blob([buffer], { type: 'application/pdf' });
   * ```
   */
  static async downloadPDF(deliverableId: string): Promise<ArrayBuffer> {
    const client = this.getClient();
    return client.getRaw(`/v1/deliverable/file/pdf/${deliverableId}`);
  }

}
