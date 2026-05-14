/**
 * TurboWebhooks Module - Org-scoped webhook subscription management
 *
 * Wraps the backend `/api/webhooks/*` surface. All routes require an admin
 * `TDX-` API key. Webhook management does not send signature emails, so
 * `skipSenderValidation: true` is hardcoded inside `configure()` and
 * `getClient()` to avoid the senderEmail-required `ValidationError` from
 * `HttpClient`.
 */

import { HttpClient, HttpClientConfig } from '../http';
import {
  CreateWebhookRequest,
  CreateWebhookResponse,
  ListDeliveriesRequest,
  ListDeliveriesResponse,
  ListWebhooksRequest,
  ListWebhooksResponse,
  NotifyWebhookResponse,
  RegenerateSecretResponse,
  ReplayDeliveryResponse,
  TestWebhookRequest,
  TestWebhookResponse,
  UpdateWebhookRequest,
  Webhook,
  WebhookStats,
  WebhookStatsRequest,
  WebhookWithStats,
} from '../types/webhooks';

export class TurboWebhooks {
  private static client: HttpClient;

  /**
   * Configure the TurboWebhooks module with API credentials.
   *
   * Mirrors `TurboPartner.configure()` — extracts only the fields needed
   * and hardcodes `skipSenderValidation: true` as a literal so a caller
   * cannot accidentally override it by passing `skipSenderValidation: false`.
   *
   * @param config - Configuration object
   * @param config.apiKey - TurboDocx API key (required, must be administrator role)
   * @param config.orgId - Organization ID (required)
   * @param config.baseUrl - API base URL (optional, defaults to https://api.turbodocx.com)
   *
   * @example
   * ```typescript
   * TurboWebhooks.configure({
   *   apiKey: process.env.TURBODOCX_API_KEY,
   *   orgId: process.env.TURBODOCX_ORG_ID,
   * });
   * ```
   */
  static configure(config: HttpClientConfig): void {
    this.client = new HttpClient({
      apiKey: config.apiKey,
      accessToken: config.accessToken,
      orgId: config.orgId,
      baseUrl: config.baseUrl,
      skipSenderValidation: true,
    });
  }

  /**
   * Get the HTTP client instance, initializing from env vars if necessary.
   * Mirrors `TurboPartner.getClient()` — fails loudly with a descriptive
   * error rather than silently auto-configuring.
   */
  private static getClient(): HttpClient {
    if (!this.client) {
      const apiKey = process.env.TURBODOCX_API_KEY;
      const orgId = process.env.TURBODOCX_ORG_ID;
      if (!apiKey || !orgId) {
        throw new Error(
          'TurboWebhooks must be configured before use. Call TurboWebhooks.configure() ' +
            'or set TURBODOCX_API_KEY and TURBODOCX_ORG_ID environment variables.',
        );
      }
      this.configure({ apiKey, orgId });
    }
    return this.client;
  }

  /**
   * Create a webhook subscription. The returned `secret` is shown ONCE and
   * must be saved by the caller; it is never returned again by any other
   * endpoint. Webhook URLs must use HTTPS.
   */
  static async createWebhook(input: CreateWebhookRequest): Promise<CreateWebhookResponse> {
    // Backend response is `{ data: { id, secret }, message }`. Because `data`
    // is not the sole top-level key, the HttpClient's smartUnwrap returns the
    // envelope as-is. Pull `.data` here so the SDK return shape stays domain-focused.
    const envelope = await this.getClient().post<{ data: CreateWebhookResponse }>(
      '/api/webhooks',
      input,
    );
    return envelope.data;
  }

  /** List webhook subscriptions for the configured org. */
  static async listWebhooks(input: ListWebhooksRequest = {}): Promise<ListWebhooksResponse> {
    return this.getClient().get<ListWebhooksResponse>('/api/webhooks', input);
  }

  /** Get a single webhook by name with current delivery stats and available events. */
  static async getWebhook(name: string): Promise<WebhookWithStats> {
    return this.getClient().get<WebhookWithStats>(
      `/api/webhooks/${encodeURIComponent(name)}`,
    );
  }

  /** Patch one or more fields on an existing webhook. */
  static async updateWebhook(name: string, patch: UpdateWebhookRequest): Promise<Webhook> {
    // Backend returns `{ data: webhook, message }` — same envelope quirk as
    // createWebhook. smartUnwrap leaves it alone because of the extra `message`
    // key, so we extract `.data` explicitly.
    const envelope = await this.getClient().patch<{ data: Webhook }>(
      `/api/webhooks/${encodeURIComponent(name)}`,
      patch,
    );
    return envelope.data;
  }

  /** Soft-delete a webhook and its delivery history. */
  static async deleteWebhook(name: string): Promise<{ message: string }> {
    return this.getClient().delete<{ message: string }>(
      `/api/webhooks/${encodeURIComponent(name)}`,
    );
  }

  /** Send a test delivery to all URLs configured on the webhook. */
  static async testWebhook(
    name: string,
    input: TestWebhookRequest,
  ): Promise<TestWebhookResponse> {
    // Envelope: `{ data: { deliveries, summary }, message }`
    const envelope = await this.getClient().post<{ data: TestWebhookResponse }>(
      `/api/webhooks/${encodeURIComponent(name)}/test`,
      input,
    );
    return envelope.data;
  }

  /**
   * Send a manual notification to all URLs configured on the webhook.
   *
   * NOTE: This routes to the same internal delivery path as `testWebhook` and
   * returns the same payload shape. The backend differentiates the two only in
   * the response/error message strings ("Test webhook sent..." vs
   * "Manual notification sent...", "Cannot test inactive webhook" vs
   * "Cannot send notification to inactive webhook"). Prefer `testWebhook` in
   * new code; `notifyWebhook` exists for symmetry with the backend route.
   */
  static async notifyWebhook(
    name: string,
    input: TestWebhookRequest,
  ): Promise<NotifyWebhookResponse> {
    // Envelope: `{ data: { deliveries, summary }, message }`
    const envelope = await this.getClient().post<{ data: NotifyWebhookResponse }>(
      `/api/webhooks/${encodeURIComponent(name)}/notify`,
      input,
    );
    return envelope.data;
  }

  /**
   * Rotate the webhook's HMAC secret. The new secret is shown ONCE in the
   * response and must be saved; old signatures will fail immediately.
   */
  static async regenerateWebhookSecret(name: string): Promise<RegenerateSecretResponse> {
    // Envelope: `{ data: { id, secret, regeneratedAt }, message }`
    const envelope = await this.getClient().post<{ data: RegenerateSecretResponse }>(
      `/api/webhooks/${encodeURIComponent(name)}/regenerate`,
    );
    return envelope.data;
  }

  /** List historical delivery attempts for a webhook, with optional filters. */
  static async listWebhookDeliveries(
    name: string,
    input: ListDeliveriesRequest = {},
  ): Promise<ListDeliveriesResponse> {
    return this.getClient().get<ListDeliveriesResponse>(
      `/api/webhooks/${encodeURIComponent(name)}/deliveries`,
      input,
    );
  }

  /** Manually retry a specific past delivery by ID. */
  static async replayWebhookDelivery(
    name: string,
    deliveryId: string,
  ): Promise<ReplayDeliveryResponse> {
    // Envelope: `{ data: { id, httpStatus }, message }`
    const envelope = await this.getClient().post<{ data: ReplayDeliveryResponse }>(
      `/api/webhooks/${encodeURIComponent(name)}/replay`,
      { deliveryId },
    );
    return envelope.data;
  }

  /** Aggregate delivery stats for the webhook over a sliding window (days). */
  static async getWebhookStats(
    name: string,
    input: WebhookStatsRequest = {},
  ): Promise<WebhookStats> {
    return this.getClient().get<WebhookStats>(
      `/api/webhooks/${encodeURIComponent(name)}/stats`,
      input,
    );
  }
}
