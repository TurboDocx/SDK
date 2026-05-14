<?php

declare(strict_types=1);

namespace TurboDocx;

use TurboDocx\Config\HttpClientConfig;

/**
 * TurboWebhooks - Org-scoped webhook subscription management
 *
 * Wraps the backend /api/webhooks/* surface. All routes require an admin
 * TDX- API key. Webhook management does not send signature emails, so this
 * class constructs its HttpClient with skipSenderValidation=true so a
 * caller can omit senderEmail safely.
 *
 * POST/PATCH responses come back as `{"data": ..., "message": ...}` envelopes
 * which the HttpClient's smartUnwrap leaves intact (it only unwraps
 * single-key {data} responses). Methods that hit non-GET routes therefore
 * extract `['data']` explicitly. GET routes are auto-unwrapped.
 *
 * @example
 * ```php
 * TurboWebhooks::configure(new HttpClientConfig(
 *     apiKey: 'TDX-...',
 *     orgId: '...',
 *     skipSenderValidation: true,
 * ));
 *
 * // OR rely on env vars:
 * // TURBODOCX_API_KEY, TURBODOCX_ORG_ID, TURBODOCX_BASE_URL
 *
 * $created = TurboWebhooks::createWebhook(
 *     name: 'order-fulfillment',
 *     urls: ['https://your-server.example.com/webhooks/turbodocx'],
 *     events: ['signature.document.completed'],
 * );
 * ```
 */
final class TurboWebhooks
{
    private static ?HttpClient $client = null;

    /**
     * Configure TurboWebhooks with API credentials. Pass an HttpClientConfig
     * constructed with skipSenderValidation: true (webhooks don't send emails,
     * so the SDK helper TurboWebhooks::configureFromCredentials() does this
     * automatically — use it if you don't want to construct the config yourself).
     */
    public static function configure(HttpClientConfig $config): void
    {
        self::$client = new HttpClient($config);
    }

    /**
     * Convenience configuration: pass raw credentials and let the SDK
     * construct an HttpClientConfig with skipSenderValidation=true.
     */
    public static function configureFromCredentials(
        string $apiKey,
        string $orgId,
        string $baseUrl = 'https://api.turbodocx.com',
    ): void {
        self::$client = new HttpClient(new HttpClientConfig(
            apiKey: $apiKey,
            baseUrl: $baseUrl,
            orgId: $orgId,
            skipSenderValidation: true,
        ));
    }

    /**
     * Get the HTTP client instance, auto-initializing from environment
     * variables if neither configure() nor configureFromCredentials() has
     * been called. Raises a clear error if the required env vars are absent.
     *
     * Mirrors TurboPartner's loud-failure pattern rather than TurboSign's
     * silent auto-configure.
     */
    private static function getClient(): HttpClient
    {
        if (self::$client === null) {
            $apiKey = getenv('TURBODOCX_API_KEY') ?: null;
            $orgId = getenv('TURBODOCX_ORG_ID') ?: null;
            if ($apiKey === null || $orgId === null) {
                throw new \RuntimeException(
                    'TurboWebhooks not configured. Call TurboWebhooks::configureFromCredentials(...) '
                    . 'or set TURBODOCX_API_KEY and TURBODOCX_ORG_ID environment variables.'
                );
            }
            self::configureFromCredentials(
                apiKey: $apiKey,
                orgId: $orgId,
                baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com',
            );
        }
        return self::$client;
    }

    /**
     * URL-encode a webhook name for path interpolation.
     * rawurlencode encodes / and other reserved chars (urlencode would leave them).
     */
    private static function encodeName(string $name): string
    {
        return rawurlencode($name);
    }

    // ============================================
    // CRUD
    // ============================================

    /**
     * Create a webhook subscription. The returned `secret` is shown ONCE
     * and must be stored on receipt; it cannot be retrieved later.
     *
     * @param string $name Unique name within the org
     * @param array<int, string> $urls HTTPS URLs (HTTP returns 400)
     * @param array<int, string> $events Event types (e.g. "signature.document.completed")
     * @return array<string, mixed> {id: string, secret: string}
     */
    public static function createWebhook(string $name, array $urls, array $events): array
    {
        $envelope = self::getClient()->post('/api/webhooks', [
            'name' => $name,
            'urls' => $urls,
            'events' => $events,
        ]);
        return $envelope['data'];
    }

    /**
     * List webhook subscriptions for the configured org.
     *
     * @return array<string, mixed> {results: array, totalRecords: int, limit: int, offset: int}
     */
    public static function listWebhooks(
        ?int $limit = null,
        ?int $offset = null,
        ?string $name = null,
        ?bool $isActive = null,
    ): array {
        $params = array_filter(
            [
                'limit' => $limit,
                'offset' => $offset,
                'name' => $name,
                'isActive' => $isActive,
            ],
            fn ($v) => $v !== null,
        );
        if (isset($params['isActive'])) {
            $params['isActive'] = $params['isActive'] ? 'true' : 'false';
        }
        return self::getClient()->get('/api/webhooks', $params);
    }

    /**
     * Get a single webhook by name with current delivery stats and the
     * server-provided list of subscribable events.
     *
     * @return array<string, mixed>
     */
    public static function getWebhook(string $name): array
    {
        return self::getClient()->get('/api/webhooks/' . self::encodeName($name));
    }

    /**
     * Patch one or more fields on an existing webhook.
     *
     * @param array<int, string>|null $urls
     * @param array<int, string>|null $events
     * @return array<string, mixed>
     */
    public static function updateWebhook(
        string $name,
        ?string $newName = null,
        ?array $urls = null,
        ?array $events = null,
        ?bool $isActive = null,
    ): array {
        $body = array_filter(
            [
                'name' => $newName,
                'urls' => $urls,
                'events' => $events,
                'isActive' => $isActive,
            ],
            fn ($v) => $v !== null,
        );
        $envelope = self::getClient()->patch('/api/webhooks/' . self::encodeName($name), $body);
        return $envelope['data'];
    }

    /**
     * Soft-delete a webhook and its delivery history.
     *
     * @return array<string, mixed>
     */
    public static function deleteWebhook(string $name): array
    {
        return self::getClient()->delete('/api/webhooks/' . self::encodeName($name));
    }

    // ============================================
    // TEST / NOTIFY
    // ============================================

    /**
     * Send a test delivery to all URLs configured on the webhook.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed> {deliveries: array, summary: array}
     */
    public static function testWebhook(string $name, string $eventType, array $payload): array
    {
        $envelope = self::getClient()->post(
            '/api/webhooks/' . self::encodeName($name) . '/test',
            ['eventType' => $eventType, 'payload' => $payload],
        );
        return $envelope['data'];
    }

    /**
     * Send a manual notification to all URLs configured on the webhook.
     *
     * NOTE: Routes through the same backend handler as testWebhook() and
     * returns the same shape; the only wire-level difference is the response
     * message string. Prefer testWebhook() in new code.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function notifyWebhook(string $name, string $eventType, array $payload): array
    {
        $envelope = self::getClient()->post(
            '/api/webhooks/' . self::encodeName($name) . '/notify',
            ['eventType' => $eventType, 'payload' => $payload],
        );
        return $envelope['data'];
    }

    // ============================================
    // DELIVERIES + REPLAY
    // ============================================

    /**
     * List historical delivery attempts for a webhook, with optional filters.
     *
     * @return array<string, mixed>
     */
    public static function listWebhookDeliveries(
        string $name,
        ?int $limit = null,
        ?int $offset = null,
        ?string $eventType = null,
        ?bool $isDelivered = null,
        ?int $httpStatus = null,
    ): array {
        $params = array_filter(
            [
                'limit' => $limit,
                'offset' => $offset,
                'eventType' => $eventType,
                'isDelivered' => $isDelivered,
                'httpStatus' => $httpStatus,
            ],
            fn ($v) => $v !== null,
        );
        if (isset($params['isDelivered'])) {
            $params['isDelivered'] = $params['isDelivered'] ? 'true' : 'false';
        }
        return self::getClient()->get(
            '/api/webhooks/' . self::encodeName($name) . '/deliveries',
            $params,
        );
    }

    /**
     * Manually retry a specific past delivery by ID.
     *
     * @return array<string, mixed>
     */
    public static function replayWebhookDelivery(string $name, string $deliveryId): array
    {
        $envelope = self::getClient()->post(
            '/api/webhooks/' . self::encodeName($name) . '/replay',
            ['deliveryId' => $deliveryId],
        );
        return $envelope['data'];
    }

    // ============================================
    // SECRET ROTATION + STATS
    // ============================================

    /**
     * Rotate the webhook's HMAC secret. The new secret is shown ONCE in the
     * response and must be saved; old signatures will fail immediately.
     *
     * @return array<string, mixed> {id, secret, regeneratedAt, message}
     */
    public static function regenerateWebhookSecret(string $name): array
    {
        $envelope = self::getClient()->post(
            '/api/webhooks/' . self::encodeName($name) . '/regenerate',
            null,
        );
        return $envelope['data'];
    }

    /**
     * Aggregate delivery stats for the webhook over a sliding window.
     *
     * @return array<string, mixed>
     */
    public static function getWebhookStats(string $name, ?int $days = null): array
    {
        $params = $days !== null ? ['days' => $days] : [];
        return self::getClient()->get(
            '/api/webhooks/' . self::encodeName($name) . '/stats',
            $params,
        );
    }
}
