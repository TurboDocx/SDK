<?php

/**
 * TurboWebhooks CRUD example.
 *
 * Walks through the full lifecycle plus the error paths you actually hit
 * in practice:
 *
 *   1. configure() against the TurboDocx API
 *   2. create the signature webhook
 *   3. trigger the conflict path (second create with the same name → 409)
 *   4. read (get) the webhook + its delivery stats
 *   5. update its URL list and confirm the change
 *   6. test-fire it (and surface per-URL failure strings)
 *   7. rotate its secret
 *   8. list past delivery attempts
 *   9. delete it
 *  10. confirm reads against the now-deleted webhook return 404
 *
 * Run:
 *
 *   export TURBODOCX_API_KEY=TDX-...
 *   export TURBODOCX_ORG_ID=...
 *   php examples/turbowebhooks-crud.php
 *
 * Optionally override the API host with TURBODOCX_BASE_URL.
 *
 * Requires an admin-scoped TDX- API key. The webhook route gate is
 * requireOrgRole(administrator); a non-admin key will 403 here.
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboWebhooks;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\AuthorizationException;
use TurboDocx\Exceptions\ConflictException;
use TurboDocx\Exceptions\NetworkException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\Exceptions\RateLimitException;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Exceptions\ValidationException; // caught only at top-level (see bottom of file)

/**
 * The URL the webhook will POST to when an event fires. The backend
 * enforces HTTPS-only — non-HTTPS URLs return 400 ValidationException.
 */
const RECEIVER_URL = 'https://your-server.example.com/webhooks/turbodocx';

const EVENT_DOCUMENT_COMPLETED = 'signature.document.completed';
const EVENT_DOCUMENT_VOIDED = 'signature.document.voided';

function section(string $title): void
{
    echo "\n";
    echo str_repeat('─', 60) . "\n";
    echo "▸ {$title}\n";
    echo str_repeat('─', 60) . "\n";
}

function pretty(mixed $value): string
{
    return json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) ?: '<unserializable>';
}

function turbowebhooksCrudExample(): void
{
    // Configure the TurboWebhooks client. skipSenderValidation: true because
    // webhooks don't send emails — only TurboSign needs a senderEmail.
    TurboWebhooks::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-admin-tdx-key-here',
        baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        skipSenderValidation: true,
    ));

    echo 'Configured TurboWebhooks against ' . (getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com') . "\n";
    echo 'Org: ' . (getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here') . "\n";

    // ────────────────────────────────────────────────────────────
    // 1. CREATE
    // ────────────────────────────────────────────────────────────
    section('CREATE webhook');

    try {
        $created = TurboWebhooks::createWebhook(
            urls: [RECEIVER_URL],
            events: [EVENT_DOCUMENT_COMPLETED, EVENT_DOCUMENT_VOIDED],
        );
        echo "Created. Save this secret — it is shown ONCE:\n";
        echo "  id:     {$created['id']}\n";
        echo "  secret: {$created['secret']}\n";
    } catch (ConflictException $e) {
        // The webhook already exists from a previous run. That's fine —
        // continue with the rest of the example so you can still exercise
        // update / test / delete. Any other error (400 ValidationException,
        // 401, 403, network, etc.) bubbles up to the top-level handler
        // below where each branch has its own dedicated message.
        echo "A signature webhook already exists for this org (409). Continuing.\n";
    }

    // ────────────────────────────────────────────────────────────
    // 2. CONFLICT PATH — create again, expect 409
    // ────────────────────────────────────────────────────────────
    section('Trigger duplicate-name conflict (expect 409)');

    try {
        TurboWebhooks::createWebhook(
            urls: [RECEIVER_URL],
            events: [EVENT_DOCUMENT_COMPLETED],
        );
        echo "Unexpected: second create succeeded. Did the webhook get deleted between calls?\n";
    } catch (ConflictException $e) {
        echo "Got the expected 409 ConflictException.\n";
        echo "  message:    {$e->getMessage()}\n";
        echo "  statusCode: {$e->statusCode}\n";
        echo "  code:       {$e->errorCode}\n";
    }

    // ────────────────────────────────────────────────────────────
    // 3. READ
    // ────────────────────────────────────────────────────────────
    section('GET webhook');

    $webhook = TurboWebhooks::getWebhook();
    echo "Webhook:\n";
    echo "  id:        {$webhook['id']}\n";
    echo "  name:      {$webhook['name']}\n";
    echo '  urls:      ' . pretty($webhook['urls']) . "\n";
    echo '  events:    ' . pretty($webhook['events']) . "\n";
    echo '  isActive:  ' . ($webhook['isActive'] ? 'true' : 'false') . "\n";
    echo '  stats:     ' . pretty($webhook['deliveryStats']) . "\n";

    // ────────────────────────────────────────────────────────────
    // 4. UPDATE
    // ────────────────────────────────────────────────────────────
    section('UPDATE webhook (replace URL list)');

    $updated = TurboWebhooks::updateWebhook(urls: [RECEIVER_URL]);
    echo "Updated. New URLs:\n" . pretty($updated['urls']) . "\n";

    // ────────────────────────────────────────────────────────────
    // 5. TEST FIRE — surface per-URL errors
    // ────────────────────────────────────────────────────────────
    section('TEST-fire webhook');

    try {
        $result = TurboWebhooks::testWebhook(
            eventType: EVENT_DOCUMENT_COMPLETED,
            payload: [
                'documentId' => '00000000-0000-0000-0000-000000000000',
                'documentName' => 'CRUD-example test fire',
                'completedAt' => date('c'),
            ],
        );
        $summary = $result['summary'];
        echo "Summary: {$summary['successful']}/{$summary['total']} successful, "
            . "{$summary['failed']} failed\n";
        if (!empty($summary['errors'])) {
            echo "Per-URL errors:\n";
            foreach ($summary['errors'] as $err) {
                echo "  - {$err}\n";
            }
        }
    } catch (TurboDocxException $e) {
        echo "Test-fire failed: " . get_class($e) . " — {$e->getMessage()}\n";
    }

    // ────────────────────────────────────────────────────────────
    // 6. ROTATE SECRET
    // ────────────────────────────────────────────────────────────
    section('Rotate webhook secret');

    $rotated = TurboWebhooks::regenerateWebhookSecret();
    echo "Rotated. New secret (shown ONCE, save it):\n";
    echo "  secret:        {$rotated['secret']}\n";
    echo "  regeneratedAt: {$rotated['regeneratedAt']}\n";

    // ────────────────────────────────────────────────────────────
    // 7. LIST DELIVERIES
    // ────────────────────────────────────────────────────────────
    section('List recent delivery attempts');

    $deliveries = TurboWebhooks::listWebhookDeliveries(limit: 5);
    echo "Total recorded: {$deliveries['totalRecords']}\n";
    foreach ($deliveries['results'] as $i => $d) {
        $status = $d['httpStatus'] ?? 'pending';
        $delivered = isset($d['isDelivered']) && $d['isDelivered'] ? 'OK' : 'FAIL';
        echo "  [{$i}] {$d['eventType']} → {$status} ({$delivered}) at {$d['createdOn']}\n";
    }

    // ────────────────────────────────────────────────────────────
    // 8. DELETE
    // ────────────────────────────────────────────────────────────
    section('DELETE webhook');

    $delResult = TurboWebhooks::deleteWebhook();
    echo "Deleted. Server says: {$delResult['message']}\n";

    // ────────────────────────────────────────────────────────────
    // 9. POST-DELETE READ — expect 404
    // ────────────────────────────────────────────────────────────
    section('GET after delete (expect 404)');

    try {
        TurboWebhooks::getWebhook();
        echo "Unexpected: read after delete succeeded.\n";
    } catch (NotFoundException $e) {
        echo "Got the expected 404 NotFoundException: {$e->getMessage()}\n";
    }
}

// ────────────────────────────────────────────────────────────
// Top-level error handler — catches anything the per-section
// blocks didn't handle. Each branch is dedicated so the message
// tells you exactly which class of failure occurred.
// ────────────────────────────────────────────────────────────
try {
    turbowebhooksCrudExample();
    echo "\n✓ CRUD walkthrough complete.\n";
} catch (AuthenticationException $e) {
    // 401 — bad / missing TDX- API key.
    echo "\n[401] Authentication failed: {$e->getMessage()}\n";
    echo "Check TURBODOCX_API_KEY. The webhook routes require an admin TDX- key.\n";
    exit(1);
} catch (AuthorizationException $e) {
    // 403 — key is valid but the user lacks the administrator role.
    echo "\n[403] Authorization failed: {$e->getMessage()}\n";
    echo "Webhook routes require the org administrator role.\n";
    exit(1);
} catch (ValidationException $e) {
    // 400 — typically a non-HTTPS URL or an invalid event type.
    echo "\n[400] Validation error: {$e->getMessage()}\n";
    exit(1);
} catch (NotFoundException $e) {
    // 404 — the signature webhook doesn't exist for this org yet.
    echo "\n[404] Not found: {$e->getMessage()}\n";
    exit(1);
} catch (RateLimitException $e) {
    // 429 — back off and retry.
    echo "\n[429] Rate limited: {$e->getMessage()}\n";
    exit(1);
} catch (ConflictException $e) {
    // 409 — duplicate-name conflict that escaped a section-level catch.
    echo "\n[409] Conflict: {$e->getMessage()}\n";
    exit(1);
} catch (NetworkException $e) {
    // No status — the request never reached the server (DNS, refused, etc.).
    echo "\n[network] Could not reach the backend: {$e->getMessage()}\n";
    $configuredBaseUrl = getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com';
    echo "Could not reach {$configuredBaseUrl}.\n";
    exit(1);
} catch (TurboDocxException $e) {
    // Any other typed SDK error (e.g. raw 5xx).
    $statusLabel = $e->statusCode === null ? '?' : (string) $e->statusCode;
    echo "\n[{$statusLabel}] {$e->getMessage()}\n";
    exit(1);
}
