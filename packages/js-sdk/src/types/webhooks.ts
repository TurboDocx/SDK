/**
 * TurboWebhooks Module - Type definitions
 *
 * Mirrors the backend `/api/webhooks/*` surface. Shapes are derived from
 * RapidDocxBackend `src/routes/Webhooks/index.ts` and `src/handlers/Webhook/`.
 */

/**
 * The TurboSign webhook events, keyed by a short name.
 *
 * Each member's doc comment states exactly what the event fires on. Use these
 * instead of raw strings so a typo is a compile error rather than a webhook
 * that never fires.
 *
 * ```typescript
 * import { TurboWebhooks, WebhookEvents } from '@turbodocx/sdk';
 *
 * await TurboWebhooks.createWebhook({
 *   urls: ['https://your-server.example.com/webhooks/turbodocx'],
 *   events: [WebhookEvents.RECIPIENT_SIGNED, WebhookEvents.COMPLETED],
 * });
 * ```
 */
export const WebhookEvents = {
  /** The document is dispatched to recipients. */
  SENT: 'signature.document.sent',

  /** A recipient opens the document for the first time. */
  VIEWED: 'signature.document.viewed',

  /**
   * Any individual signer completes their signature — fires **once per signer**,
   * including the last one. The payload carries the signer's identity plus
   * `is_final_signer` (true only on the last signature) and `remaining_signers`.
   *
   * This is the per-person event, and it always fires *before* the
   * document-level outcome (`SIGNED`, `COMPLETED`, or `FINALIZATION_FAILED`).
   */
  RECIPIENT_SIGNED: 'signature.document.recipient_signed',

  /**
   * A signer signs but the document is **not yet complete** — document-level
   * partial progress.
   *
   * Two consequences worth internalizing:
   *  - **It never fires on the final signature.** To detect "the whole document
   *    is done", use {@link WebhookEvents.COMPLETED} (or `RECIPIENT_SIGNED` with
   *    `is_final_signer: true`) — NOT this event.
   *  - **A single-signer document never emits it at all.** That document emits
   *    `RECIPIENT_SIGNED` (`is_final_signer: true`) then `COMPLETED`.
   */
  SIGNED: 'signature.document.signed',

  /** All recipients have signed and the signed PDF is finalized. */
  COMPLETED: 'signature.document.completed',

  /**
   * The signed PDF fails to finalize (e.g. a KMS signing error). The document is
   * **not** completed — this fires *instead of* `COMPLETED` on the final signature.
   */
  FINALIZATION_FAILED: 'signature.document.finalization_failed',

  /** The document is voided or cancelled. */
  VOIDED: 'signature.document.voided',
} as const;

/**
 * All 7 TurboSign webhook events, in lifecycle order.
 *
 * Every signature fires `recipient_signed` first, then exactly one of
 * `completed` / `finalization_failed` (that was the final signature) or
 * `signed` (signers still remain).
 */
export const WEBHOOK_EVENTS = [
  WebhookEvents.SENT,
  WebhookEvents.VIEWED,
  WebhookEvents.RECIPIENT_SIGNED,
  WebhookEvents.SIGNED,
  WebhookEvents.COMPLETED,
  WebhookEvents.FINALIZATION_FAILED,
  WebhookEvents.VOIDED,
] as const;

/** The closed union of the 7 events the backend dispatches today. */
export type KnownWebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/**
 * A webhook event type.
 *
 * Autocompletes to the 7 {@link KnownWebhookEvent} values while still accepting
 * any string — the backend can add new events without an SDK release, and code
 * that already passes a raw string keeps compiling.
 */
export type WebhookEvent = KnownWebhookEvent | (string & {});

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
  /** 1–10 URLs. Backend enforces HTTPS-only; HTTP URLs return 400 ValidationError. */
  urls: string[];
  /** At least one event. */
  events: WebhookEvent[];
}

export interface CreateWebhookResponse {
  id: string;
  /** Shown ONCE. Save on receipt; never returned again by any other endpoint. */
  secret: string;
}

export interface UpdateWebhookRequest {
  /** Optional, but an empty array is a 400 — omit the key instead. Max 10 URLs. */
  urls?: string[];
  /** Optional, but an empty array is a 400 — omit the key instead. */
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
