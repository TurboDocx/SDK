/**
 * Webhooks Module - Organization-wide webhook configuration for events
 *
 * Webhooks are configured at the organization level and apply to ALL signature events.
 * You cannot set webhooks per-signature request - configure them once here.
 */

import { HttpClient, HttpClientConfig } from '../http';
import {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  Webhook,
  WebhookWithSecret,
  WebhookStats,
  WebhookDelivery,
  ListWebhooksOptions,
  ListWebhooksResponse,
  ListDeliveriesOptions,
  ListDeliveriesResponse,
  TestWebhookResult,
  RegeneratedSecret,
  WebhookEvent
} from '../types/webhooks';

export class Webhooks {
  private static client: HttpClient;

  /**
   * Configure the Webhooks module with authentication
   *
   * @param config - Configuration with API key or access token
   *
   * @example
   * ```typescript
   * Webhooks.configure({ apiKey: 'your-api-key' });
   * ```
   */
  static configure(config: HttpClientConfig): void {
    this.client = new HttpClient(config);
  }

  /**
   * Get configured HTTP client
   */
  private static getClient(): HttpClient {
    if (!this.client) {
      throw new Error('Webhooks module not configured. Call Webhooks.configure() first.');
    }
    return this.client;
  }

  // ============================================
  // CORE CRUD OPERATIONS
  // ============================================

  /**
   * List all webhooks for the organization
   *
   * @param options - Pagination and filter options
   * @returns List of webhooks with stats
   *
   * @example
   * ```typescript
   * const webhooks = await Webhooks.list({ limit: 10, isActive: true });
   * console.log(`Found ${webhooks.totalRecords} webhooks`);
   * ```
   */
  static async list(options?: ListWebhooksOptions): Promise<ListWebhooksResponse> {
    const client = this.getClient();
    const response = await client.get<{ data: ListWebhooksResponse }>('/api/webhooks', options);
    return response.data;
  }

  /**
   * Create a new webhook
   *
   * **IMPORTANT**: The secret is only returned ONCE on creation. Save it securely!
   *
   * @param name - Unique webhook name
   * @param urls - Array of HTTPS URLs (max 10)
   * @param events - Events to subscribe to
   * @returns Webhook with secret (save the secret - won't be shown again!)
   *
   * @example
   * ```typescript
   * const webhook = await Webhooks.create(
   *   'signature-webhook',
   *   ['https://your-app.com/webhooks/turbosign'],
   *   [WebhookEvent.SIGNATURE_DOCUMENT_COMPLETED]
   * );
   *
   * // IMPORTANT: Save the secret securely!
   * console.log('Webhook Secret (save this!):', webhook.secret);
   * ```
   */
  static async create(
    name: string,
    urls: string[],
    events: WebhookEvent[]
  ): Promise<WebhookWithSecret> {
    const client = this.getClient();

    // Validate HTTPS URLs
    for (const url of urls) {
      if (!url.startsWith('https://')) {
        throw new Error(`All webhook URLs must use HTTPS. Invalid URL: ${url}`);
      }
    }

    const response = await client.post<{ data: WebhookWithSecret }>('/api/webhooks', {
      name,
      urls,
      events
    });

    return response.data;
  }

  /**
   * Get webhook details by name
   *
   * @param name - Webhook name
   * @returns Webhook details with delivery statistics
   *
   * @example
   * ```typescript
   * const webhook = await Webhooks.get('signature-webhook');
   * console.log('Webhook URLs:', webhook.urls);
   * console.log('Subscribed events:', webhook.events);
   * ```
   */
  static async get(name: string): Promise<Webhook> {
    const client = this.getClient();
    const response = await client.get<{ data: Webhook }>(`/api/webhooks/${name}`);
    return response.data;
  }

  /**
   * Update an existing webhook
   *
   * @param name - Webhook name to update
   * @param updates - Fields to update
   * @returns Updated webhook
   *
   * @example
   * ```typescript
   * // Add a new URL
   * const updated = await Webhooks.update('signature-webhook', {
   *   urls: [
   *     'https://your-app.com/webhooks/turbosign',
   *     'https://backup.your-app.com/webhooks/turbosign'
   *   ]
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Disable webhook temporarily
   * await Webhooks.update('signature-webhook', { isActive: false });
   * ```
   */
  static async update(name: string, updates: UpdateWebhookRequest): Promise<Webhook> {
    const client = this.getClient();

    // Validate HTTPS URLs if updating URLs
    if (updates.urls) {
      for (const url of updates.urls) {
        if (!url.startsWith('https://')) {
          throw new Error(`All webhook URLs must use HTTPS. Invalid URL: ${url}`);
        }
      }
    }

    const response = await client.patch<{ data: Webhook }>(`/api/webhooks/${name}`, updates);
    return response.data;
  }

  /**
   * Delete a webhook
   *
   * @param name - Webhook name to delete
   * @returns Deletion confirmation
   *
   * @example
   * ```typescript
   * await Webhooks.delete('old-webhook');
   * console.log('Webhook deleted successfully');
   * ```
   */
  static async delete(name: string): Promise<{ message: string }> {
    const client = this.getClient();
    return await client.delete(`/api/webhooks/${name}`);
  }

  // ============================================
  // SECURITY OPERATIONS
  // ============================================

  /**
   * Regenerate webhook secret
   *
   * **IMPORTANT**: The new secret is only returned ONCE. Save it securely!
   * This invalidates the old secret immediately.
   *
   * @param name - Webhook name
   * @returns New secret (save this - won't be shown again!)
   *
   * @example
   * ```typescript
   * const { secret } = await Webhooks.regenerateSecret('signature-webhook');
   * console.log('New secret (save this!):', secret);
   * // Update your webhook verification code with the new secret
   * ```
   */
  static async regenerateSecret(name: string): Promise<RegeneratedSecret> {
    const client = this.getClient();
    const response = await client.post<{ data: RegeneratedSecret }>(
      `/api/webhooks/${name}/regenerate`,
      {}
    );
    return response.data;
  }

  // ============================================
  // TESTING & MONITORING
  // ============================================

  /**
   * Test a webhook by sending a test event
   *
   * @param name - Webhook name to test
   * @param eventType - Optional specific event type to test
   * @param payload - Optional custom test payload
   * @returns Test delivery results
   *
   * @example
   * ```typescript
   * // Test with default event
   * const result = await Webhooks.test('signature-webhook');
   * console.log(`Sent to ${result.summary.total} URLs`);
   * console.log(`Successful: ${result.summary.successful}`);
   * console.log(`Failed: ${result.summary.failed}`);
   * ```
   *
   * @example
   * ```typescript
   * // Test specific event with custom payload
   * const result = await Webhooks.test(
   *   'signature-webhook',
   *   WebhookEvent.SIGNATURE_DOCUMENT_COMPLETED,
   *   { documentId: 'test-123', testMode: true }
   * );
   * ```
   */
  static async test(
    name: string,
    eventType?: WebhookEvent,
    payload?: Record<string, any>
  ): Promise<TestWebhookResult> {
    const client = this.getClient();
    const response = await client.post<{ data: TestWebhookResult }>(
      `/api/webhooks/${name}/test`,
      { eventType, payload }
    );
    return response.data;
  }

  /**
   * Get webhook delivery attempts
   *
   * @param name - Webhook name
   * @param options - Filter and pagination options
   * @returns List of delivery attempts
   *
   * @example
   * ```typescript
   * // Get recent failed deliveries
   * const deliveries = await Webhooks.getDeliveries('signature-webhook', {
   *   isDelivered: false,
   *   limit: 20
   * });
   *
   * deliveries.results.forEach(delivery => {
   *   console.log(`Failed delivery: ${delivery.errorMessage}`);
   * });
   * ```
   */
  static async getDeliveries(
    name: string,
    options?: ListDeliveriesOptions
  ): Promise<ListDeliveriesResponse> {
    const client = this.getClient();
    const response = await client.get<{ data: ListDeliveriesResponse }>(
      `/api/webhooks/${name}/deliveries`,
      options
    );
    return response.data;
  }

  /**
   * Replay a failed webhook delivery
   *
   * @param name - Webhook name
   * @param deliveryId - ID of the delivery to replay
   * @returns New delivery attempt
   *
   * @example
   * ```typescript
   * // Get failed deliveries and replay them
   * const deliveries = await Webhooks.getDeliveries('signature-webhook', {
   *   isDelivered: false
   * });
   *
   * for (const delivery of deliveries.results) {
   *   console.log(`Replaying failed delivery ${delivery.id}...`);
   *   await Webhooks.replayDelivery('signature-webhook', delivery.id);
   * }
   * ```
   */
  static async replayDelivery(name: string, deliveryId: string): Promise<WebhookDelivery> {
    const client = this.getClient();
    const response = await client.post<{ data: WebhookDelivery }>(
      `/api/webhooks/${name}/replay`,
      { deliveryId }
    );
    return response.data;
  }

  /**
   * Get detailed webhook statistics
   *
   * @param name - Webhook name
   * @param days - Number of days to include in stats (default: 30)
   * @returns Detailed statistics
   *
   * @example
   * ```typescript
   * const stats = await Webhooks.getStats('signature-webhook', 7);
   *
   * console.log(`Success rate: ${stats.summary.successRate}%`);
   * console.log(`Avg response time: ${stats.summary.avgResponseTime}ms`);
   *
   * stats.eventBreakdown.forEach(event => {
   *   console.log(`${event.eventType}: ${event.total} deliveries (${event.successRate}% success)`);
   * });
   * ```
   */
  static async getStats(name: string, days: number = 30): Promise<WebhookStats> {
    const client = this.getClient();
    const response = await client.get<{ data: WebhookStats }>(
      `/api/webhooks/${name}/stats`,
      { days }
    );
    return response.data;
  }

  /**
   * Send manual notification to webhook
   *
   * Useful for triggering custom events or testing specific scenarios
   *
   * @param name - Webhook name
   * @param eventType - Event type to send
   * @param payload - Custom event payload
   * @returns Delivery result
   *
   * @example
   * ```typescript
   * await Webhooks.sendNotification(
   *   'signature-webhook',
   *   WebhookEvent.SIGNATURE_DOCUMENT_COMPLETED,
   *   {
   *     documentId: 'doc-123',
   *     completedAt: new Date().toISOString(),
   *     customData: { source: 'manual-trigger' }
   *   }
   * );
   * ```
   */
  static async sendNotification(
    name: string,
    eventType: WebhookEvent,
    payload: Record<string, any>
  ): Promise<TestWebhookResult> {
    const client = this.getClient();
    const response = await client.post<{ data: TestWebhookResult }>(
      `/api/webhooks/${name}/notify`,
      { eventType, payload }
    );
    return response.data;
  }
}
