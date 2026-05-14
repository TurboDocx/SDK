/**
 * TurboWebhooks Module - Org-scoped signature webhook subscription
 *
 * The SDK is intentionally locked to a single webhook per org, identified by
 * the fixed name `signature`. This matches the UI's "Signature Webhooks"
 * settings page so SDK-created webhooks show up where users expect to manage
 * them. To manage multiple webhooks per org, call the REST API directly.
 *
 * All routes require an admin TDX- API key. Webhook management does not
 * send signature emails, so `skipSenderValidation: true` is hardcoded
 * inside `configure()` and `getClient()`.
 *
 * POST/PATCH responses come back as `{ data, message }` envelopes which
 * `smartUnwrap` leaves intact (it only unwraps single-key `{ data }`).
 * Methods that hit non-GET routes extract `.data` explicitly. GET routes
 * are auto-unwrapped.
 */

import { HttpClient, HttpClientConfig } from '../http';
import {
  CreateWebhookRequest,
  CreateWebhookResponse,
  ListDeliveriesRequest,
  ListDeliveriesResponse,
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

/**
 * The fixed name used for the single SDK-managed webhook per org.
 * Mirrors the convention enforced by the UI's Signature Webhooks settings.
 */
const SIGNATURE_WEBHOOK_NAME = 'signature';

export class TurboWebhooks {
  private static client: HttpClient;

  /**
   * Configure the TurboWebhooks module with API credentials.
   *
   * Mirrors `TurboPartner.configure()` — extracts only the fields needed
   * and hardcodes `skipSenderValidation: true` as a literal.
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
   * Lazy fallback to env-driven config. Mirrors `TurboPartner.getClient()` —
   * explicit env-var check + descriptive error, NOT TurboSign's silent
   * auto-configure pattern.
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
   * Create the org's signature webhook. The returned `secret` is shown ONCE;
   * store it on receipt — it cannot be retrieved later.
   *
   * If a webhook named `signature` already exists, the backend returns 400
   * ValidationError. Update the existing webhook with `updateWebhook` or
   * delete it first.
   */
  static async createWebhook(input: CreateWebhookRequest): Promise<CreateWebhookResponse> {
    const envelope = await this.getClient().post<{ data: CreateWebhookResponse }>(
      '/api/webhooks',
      { name: SIGNATURE_WEBHOOK_NAME, ...input },
    );
    return envelope.data;
  }

  /** Get the org's signature webhook with delivery stats + available events. */
  static async getWebhook(): Promise<WebhookWithStats> {
    return this.getClient().get<WebhookWithStats>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}`,
    );
  }

  /** Patch one or more fields on the signature webhook. */
  static async updateWebhook(patch: UpdateWebhookRequest): Promise<Webhook> {
    const envelope = await this.getClient().patch<{ data: Webhook }>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}`,
      patch,
    );
    return envelope.data;
  }

  /** Soft-delete the signature webhook and its delivery history. */
  static async deleteWebhook(): Promise<{ message: string }> {
    return this.getClient().delete<{ message: string }>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}`,
    );
  }

  /** Send a test delivery to all URLs configured on the signature webhook. */
  static async testWebhook(input: TestWebhookRequest): Promise<TestWebhookResponse> {
    const envelope = await this.getClient().post<{ data: TestWebhookResponse }>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}/test`,
      input,
    );
    return envelope.data;
  }

  /**
   * Send a manual notification to all URLs configured on the signature
   * webhook. Routes through the same backend handler as `testWebhook` —
   * only the response/error message strings differ.
   */
  static async notifyWebhook(input: TestWebhookRequest): Promise<NotifyWebhookResponse> {
    const envelope = await this.getClient().post<{ data: NotifyWebhookResponse }>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}/notify`,
      input,
    );
    return envelope.data;
  }

  /**
   * Rotate the webhook's HMAC secret. The new secret is shown ONCE; old
   * signatures will fail immediately.
   */
  static async regenerateWebhookSecret(): Promise<RegenerateSecretResponse> {
    const envelope = await this.getClient().post<{ data: RegenerateSecretResponse }>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}/regenerate`,
    );
    return envelope.data;
  }

  /** List historical delivery attempts for the signature webhook. */
  static async listWebhookDeliveries(
    input: ListDeliveriesRequest = {},
  ): Promise<ListDeliveriesResponse> {
    return this.getClient().get<ListDeliveriesResponse>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}/deliveries`,
      input,
    );
  }

  /** Manually retry a specific past delivery by ID. */
  static async replayWebhookDelivery(deliveryId: string): Promise<ReplayDeliveryResponse> {
    const envelope = await this.getClient().post<{ data: ReplayDeliveryResponse }>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}/replay`,
      { deliveryId },
    );
    return envelope.data;
  }

  /** Aggregate delivery stats over a sliding window (days). */
  static async getWebhookStats(input: WebhookStatsRequest = {}): Promise<WebhookStats> {
    return this.getClient().get<WebhookStats>(
      `/api/webhooks/${SIGNATURE_WEBHOOK_NAME}/stats`,
      input,
    );
  }
}
