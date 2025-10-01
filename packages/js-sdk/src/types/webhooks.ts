/**
 * TypeScript types for Webhooks module
 */

/**
 * Available webhook events for TurboSign
 */
export enum WebhookEvent {
  SIGNATURE_DOCUMENT_COMPLETED = 'signature.document.completed',
  SIGNATURE_DOCUMENT_VOIDED = 'signature.document.voided'
}

/**
 * Request to create a new webhook
 */
export interface CreateWebhookRequest {
  /** Webhook name (unique identifier) */
  name: string;
  /** Array of HTTPS URLs to send webhooks to (max 10) */
  urls: string[];
  /** Events to subscribe to */
  events: WebhookEvent[];
}

/**
 * Request to update an existing webhook
 */
export interface UpdateWebhookRequest {
  /** New webhook name */
  name?: string;
  /** Updated URLs */
  urls?: string[];
  /** Updated events */
  events?: WebhookEvent[];
  /** Whether webhook is active */
  isActive?: boolean;
}

/**
 * Webhook configuration
 */
export interface Webhook {
  /** Unique webhook ID */
  id: string;
  /** Webhook name */
  name: string;
  /** URLs that receive webhook events */
  urls: string[];
  /** Subscribed events */
  events: string[];
  /** Whether webhook is active */
  isActive: boolean;
  /** User ID who created the webhook */
  createdBy: string;
  /** Creation timestamp */
  createdOn: string;
  /** Last update timestamp */
  updatedOn: string;
  /** Total delivery attempts (from list endpoint) */
  totalDeliveries?: number;
  /** Successful deliveries (from list endpoint) */
  successfulDeliveries?: number;
  /** Last delivery timestamp (from list endpoint) */
  lastDelivery?: string;
}

/**
 * Webhook with secret (only returned on creation or regeneration)
 */
export interface WebhookWithSecret extends Webhook {
  /** Webhook secret for signature verification (only shown once!) */
  secret: string;
}

/**
 * Webhook delivery attempt
 */
export interface WebhookDelivery {
  /** Delivery ID */
  id: string;
  /** Event type that triggered this delivery */
  eventType: string;
  /** Target URL */
  url: string;
  /** HTTP status code from the webhook endpoint */
  httpStatus?: number;
  /** Response body from the webhook endpoint */
  responseBody?: string;
  /** Number of delivery attempts */
  attemptCount: number;
  /** Maximum attempts before giving up */
  maxAttempts: number;
  /** Whether delivery was successful */
  isDelivered: boolean;
  /** Delivery status */
  status: string;
  /** When successfully delivered */
  deliveredAt?: string;
  /** Error message if delivery failed */
  errorMessage?: string;
  /** When delivery was created */
  createdOn: string;
  /** Last update timestamp */
  updatedOn: string;
}

/**
 * Detailed webhook statistics
 */
export interface WebhookStats {
  /** Webhook information */
  webhook: {
    id: string;
    name: string;
    isActive: boolean;
    events: string[];
    urls: string[];
  };
  /** Time period for statistics */
  period: {
    days: number;
    from: string;
    to: string;
  };
  /** Summary statistics */
  summary: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingRetries: number;
    successRate: number;
    avgResponseTime: number | null;
    lastSuccessfulDelivery?: string;
    lastFailedDelivery?: string;
  };
  /** Breakdown by event type */
  eventBreakdown: Array<{
    eventType: string;
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }>;
}

/**
 * Pagination and filter options for listing webhooks
 */
export interface ListWebhooksOptions {
  /** Maximum number of results */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
  /** Filter by webhook name (partial match) */
  name?: string;
  /** Filter by active status */
  isActive?: boolean;
}

/**
 * Response from listing webhooks
 */
export interface ListWebhooksResponse {
  /** Array of webhooks with stats */
  results: Webhook[];
  /** Total number of webhooks matching filters */
  totalRecords: number;
  /** Limit used for pagination */
  limit: number;
  /** Offset used for pagination */
  offset: number;
}

/**
 * Options for listing webhook deliveries
 */
export interface ListDeliveriesOptions {
  /** Maximum number of results */
  limit?: number;
  /** Number of results to skip */
  offset?: number;
  /** Filter by event type */
  eventType?: string;
  /** Filter by delivery status */
  isDelivered?: boolean;
  /** Filter by HTTP status code */
  httpStatus?: number;
}

/**
 * Response from listing webhook deliveries
 */
export interface ListDeliveriesResponse {
  /** Array of delivery attempts */
  results: WebhookDelivery[];
  /** Total number of deliveries matching filters */
  totalRecords: number;
  /** Limit used for pagination */
  limit: number;
  /** Offset used for pagination */
  offset: number;
}

/**
 * Test webhook delivery result
 */
export interface TestWebhookResult {
  /** Individual delivery results for each URL */
  deliveries: WebhookDelivery[];
  /** Summary of test results */
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Regenerated webhook secret
 */
export interface RegeneratedSecret {
  /** Webhook ID */
  id: string;
  /** New secret (save this - won't be shown again!) */
  secret: string;
  /** When secret was regenerated */
  regeneratedAt: string;
}
