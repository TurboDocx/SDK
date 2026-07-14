<?php

declare(strict_types=1);

namespace TurboDocx;

use TurboDocx\Config\HttpClientConfig;

/**
 * TurboWebhooks - Org-scoped signature webhook subscription
 *
 * The SDK is intentionally locked to a single webhook per org, identified by
 * the fixed name `signature`. This matches the UI's Signature Webhooks
 * settings page so SDK-managed and UI-managed webhooks stay in sync. To
 * manage multiple webhooks per org, call the REST API directly.
 *
 * POST/PATCH responses come back as `{"data": ..., "message": ...}` envelopes
 * which the HttpClient's smartUnwrap leaves intact (it only unwraps
 * single-key {data} responses). Methods that hit non-GET routes extract
 * `['data']` explicitly. GET routes are auto-unwrapped.
 *
 * @example
 * ```php
 * TurboWebhooks::configureFromCredentials(
 *     apiKey: 'TDX-...',
 *     orgId: '...',
 * );
 *
 * $created = TurboWebhooks::createWebhook(
 *     urls: ['https://your-server.example.com/webhooks/turbodocx'],
 *     events: ['signature.document.completed'],
 * );
 * ```
 */
final class TurboWebhooks
{
    public const SIGNATURE_NAME = 'signature';

    private static ?HttpClient $client = null;

    /**
     * Configure TurboWebhooks with an explicit HttpClientConfig. Pass
     * skipSenderValidation: true (webhooks don't send emails). Prefer
     * configureFromCredentials() for the common case.
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
     * Get the HTTP client, auto-initializing from env vars if not yet
     * configured. Raises a clear error if env vars are missing — mirrors
     * TurboPartner's loud-failure pattern.
     */
    private static function getClient(): HttpClient
    {
        $client = self::$client;
        if ($client === null) {
            $apiKey = getenv('TURBODOCX_API_KEY') ?: null;
            $orgId = getenv('TURBODOCX_ORG_ID') ?: null;
            if ($apiKey === null || $orgId === null) {
                throw new \RuntimeException(
                    'TurboWebhooks not configured. Call TurboWebhooks::configureFromCredentials(...) '
                    . 'or set TURBODOCX_API_KEY and TURBODOCX_ORG_ID environment variables.'
                );
            }
            $client = new HttpClient(new HttpClientConfig(
                apiKey: $apiKey,
                baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com',
                orgId: $orgId,
                skipSenderValidation: true,
            ));
            self::$client = $client;
        }
        return $client;
    }

    // ============================================
    // CRUD - always hits /api/webhooks/signature[/...]
    // ============================================

    /**
     * Create the org's signature webhook. The returned `secret` is shown
     * ONCE and must be stored on receipt; it cannot be retrieved later.
     *
     * @param array<int, string> $urls HTTPS URLs (HTTP returns 400). Min 1, max 10.
     * @param array<int, string> $events Event types (e.g. "signature.document.completed"). Min 1.
     * @return array<string, mixed> {id: string, secret: string}
     * @throws \TurboDocx\Exceptions\ConflictException HTTP 409 when the
     *         signature webhook already exists. Update or delete the existing
     *         webhook before retrying.
     */
    public static function createWebhook(array $urls, array $events): array
    {
        $envelope = self::getClient()->post('/api/webhooks', [
            'name' => self::SIGNATURE_NAME,
            'urls' => $urls,
            'events' => $events,
        ]);
        return $envelope['data'];
    }

    /**
     * Get the org's signature webhook with delivery stats + the server-
     * provided list of subscribable events.
     *
     * @return array<string, mixed>
     */
    public static function getWebhook(): array
    {
        return self::getClient()->get('/api/webhooks/' . self::SIGNATURE_NAME);
    }

    /**
     * Patch one or more fields on the signature webhook. Renaming is not
     * supported — the SDK manages a fixed name.
     *
     * Both list fields keep their minimums on update: pass null to leave a list
     * untouched. An empty array is NOT a clear — `urls: []` / `events: []` is
     * sent as-is and returns a 400.
     *
     * @param array<int, string>|null $urls Min 1, max 10 when provided; null to omit
     * @param array<int, string>|null $events Min 1 when provided; null to omit
     * @return array<string, mixed>
     * @throws \TurboDocx\Exceptions\ConflictException HTTP 409 when the patch
     *         would collide with an existing webhook name.
     */
    public static function updateWebhook(
        ?array $urls = null,
        ?array $events = null,
        ?bool $isActive = null,
    ): array {
        $body = array_filter(
            [
                'urls' => $urls,
                'events' => $events,
                'isActive' => $isActive,
            ],
            fn($v) => $v !== null,
        );
        $envelope = self::getClient()->patch('/api/webhooks/' . self::SIGNATURE_NAME, $body);
        return $envelope['data'];
    }

    /**
     * Soft-delete the signature webhook and its delivery history.
     *
     * @return array<string, mixed>
     */
    public static function deleteWebhook(): array
    {
        return self::getClient()->delete('/api/webhooks/' . self::SIGNATURE_NAME);
    }

    // ============================================
    // TEST / NOTIFY
    // ============================================

    /**
     * Send a test delivery to all URLs configured on the signature webhook.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed> {deliveries: array, summary: array}
     */
    public static function testWebhook(string $eventType, array $payload): array
    {
        $envelope = self::getClient()->post(
            '/api/webhooks/' . self::SIGNATURE_NAME . '/test',
            ['eventType' => $eventType, 'payload' => $payload],
        );
        return $envelope['data'];
    }

    /**
     * Send a manual notification. Routes through the same backend handler
     * as testWebhook() and returns the same shape; the only wire-level
     * difference is the response message string. Prefer testWebhook().
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function notifyWebhook(string $eventType, array $payload): array
    {
        $envelope = self::getClient()->post(
            '/api/webhooks/' . self::SIGNATURE_NAME . '/notify',
            ['eventType' => $eventType, 'payload' => $payload],
        );
        return $envelope['data'];
    }

    // ============================================
    // DELIVERIES + REPLAY
    // ============================================

    /**
     * List historical delivery attempts for the signature webhook.
     *
     * @return array<string, mixed>
     */
    public static function listWebhookDeliveries(
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
            fn($v) => $v !== null,
        );
        if (isset($params['isDelivered'])) {
            $params['isDelivered'] = $params['isDelivered'] ? 'true' : 'false';
        }
        return self::getClient()->get(
            '/api/webhooks/' . self::SIGNATURE_NAME . '/deliveries',
            $params,
        );
    }

    /**
     * Manually retry a specific past delivery by ID.
     *
     * @return array<string, mixed>
     */
    public static function replayWebhookDelivery(string $deliveryId): array
    {
        $envelope = self::getClient()->post(
            '/api/webhooks/' . self::SIGNATURE_NAME . '/replay',
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
    public static function regenerateWebhookSecret(): array
    {
        $envelope = self::getClient()->post(
            '/api/webhooks/' . self::SIGNATURE_NAME . '/regenerate',
            null,
        );
        return $envelope['data'];
    }

    /**
     * Aggregate delivery stats for the signature webhook over a sliding window.
     *
     * @return array<string, mixed>
     */
    public static function getWebhookStats(?int $days = null): array
    {
        $params = $days !== null ? ['days' => $days] : [];
        return self::getClient()->get(
            '/api/webhooks/' . self::SIGNATURE_NAME . '/stats',
            $params,
        );
    }
}
