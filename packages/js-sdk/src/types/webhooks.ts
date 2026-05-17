/**
 * TurboWebhooks Module - Type definitions
 *
 * Mirrors the backend `/api/webhooks/*` surface. Shapes are derived from
 * RapidDocxBackend `src/routes/Webhooks/index.ts` and `src/handlers/Webhook/`.
 */

/**
 * Known TurboDocx webhook event types. Typed as `string` (not a closed union)
 * so the backend can add new events without an SDK release.
 *
 * Known values (as of plan time):
 *   - "signature.document.completed"
 *   - "signature.document.voided"
 */
export type WebhookEvent = string;

/** Base webhook shape. Never includes `secret`. */
export interface Webhook {
  id: string;
  name: string;
  urls: string[];
  events: WebhookEvent[];
  isActive: boolean;
  createdOn: string;
  updatedOn: string;
}

/** Shape returned by `getWebhook()`. Adds delivery stats + available events. */
export interface WebhookWithStats extends Webhook {
  deliveryStats: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingRetries: number;
  };
  /** Server-provided enumeration of events currently subscribable. */
  availableEvents: WebhookEvent[];
}

export interface CreateWebhookRequest {
  /** Backend enforces HTTPS-only; HTTP URLs return 400 ValidationError. */
  urls: string[];
  events: WebhookEvent[];
}

export interface CreateWebhookResponse {
  id: string;
  /** Shown ONCE. Save on receipt; never returned again by any other endpoint. */
  secret: string;
}

export interface UpdateWebhookRequest {
  urls?: string[];
  events?: WebhookEvent[];
  isActive?: boolean;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEvent;
  payload: Record<string, unknown>;
  httpStatus: number | null;
  isDelivered: boolean;
  attemptCount: number;
  deliveredAt: string | null;
  createdOn: string;
}

export interface ListDeliveriesRequest {
  limit?: number;
  offset?: number;
  eventType?: WebhookEvent;
  isDelivered?: boolean;
  httpStatus?: number;
}

export interface ListDeliveriesResponse {
  results: WebhookDelivery[];
  totalRecords: number;
  limit: number;
  offset: number;
}

export interface TestWebhookRequest {
  eventType: WebhookEvent;
  payload: Record<string, unknown>;
}

export interface TestWebhookResponse {
  deliveries: WebhookDelivery[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    /** Per-URL failure messages; empty array on success. Mirrors backend TestWebhookResult.summary.errors. */
    errors: string[];
  };
}

/**
 * Identical shape to TestWebhookResponse. Aliased separately because the
 * backend has distinct `/test` and `/notify` routes that share an implementation
 * today; they may diverge later.
 */
export type NotifyWebhookResponse = TestWebhookResponse;

/**
 * Replay returns a freshly-created delivery row. The backend route returns
 * `{ data: WebhookDelivery, message }`; the SDK extracts `data` so callers
 * receive the full delivery shape, not just the id/httpStatus pair.
 */
export type ReplayDeliveryResponse = WebhookDelivery;

/**
 * Returned by `regenerateWebhookSecret()`. The backend envelope is
 * `{ data: { id, secret, regeneratedAt }, message }`; the SDK extracts `data`,
 * so the response does NOT include a `message` field. Save `secret` on receipt
 * — it is shown ONCE and any subsequent call will rotate it again.
 */
export interface RegenerateSecretResponse {
  id: string;
  secret: string;
  regeneratedAt: string;
}

export interface WebhookStatsRequest {
  /** 1-365, default 30. */
  days?: number;
}

export interface WebhookStats {
  webhook: Pick<Webhook, "id" | "name" | "isActive" | "events" | "urls">;
  period: { days: number; from: string; to: string };
  summary: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingRetries: number;
    /** Milliseconds. Name mirrors backend (no `Ms` suffix). */
    avgResponseTime: number;
    successRate: number;
    lastSuccessfulDelivery: string | null;
    lastFailedDelivery: string | null;
  };
  eventBreakdown: Array<{
    eventType: WebhookEvent;
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }>;
}
