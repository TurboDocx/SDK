<?php

declare(strict_types=1);

namespace TurboDocx\Utils;

/**
 * Webhook signature verification helper.
 *
 * Verifies the X-TurboDocx-Signature header on an incoming webhook delivery.
 * Format matches the backend's webhookService->generateSignature:
 *   - Header:        X-TurboDocx-Signature: sha256=<hex>
 *   - Timestamp:     X-TurboDocx-Timestamp: <unix-seconds>
 *   - String signed: "{$timestamp}.{$rawBody}"
 *   - Algorithm:     HMAC-SHA256
 *
 * Enforces a configurable timestamp tolerance (default 300s) to prevent
 * replay attacks. Uses hash_equals for constant-time comparison.
 *
 * @param string $rawBody          The raw request body bytes AS RECEIVED. Do
 *                                 NOT json_decode first; do NOT re-encode.
 *                                 Whitespace must match exactly.
 * @param string $signatureHeader  Value of the `X-TurboDocx-Signature` header
 *                                 (format: "sha256=<hex>").
 * @param string $timestampHeader  Value of the `X-TurboDocx-Timestamp`
 *                                 header (Unix epoch seconds, as string).
 * @param string $secret           Webhook secret returned by createWebhook
 *                                 or regenerateWebhookSecret.
 * @param int    $toleranceSeconds Maximum acceptable age of the timestamp,
 *                                 in seconds. Defaults to 300 (5 minutes).
 *                                 Set to 0 to disable the timestamp check
 *                                 (NOT recommended in production).
 * @param int|null $now            Override the "current time" (Unix seconds)
 *                                 for deterministic testing. Defaults to
 *                                 time().
 *
 * @return bool true iff the signature is valid AND the timestamp is within
 *              tolerance. Constant-time comparison; never throws on bad input.
 */
function verifyWebhookSignature(
    string $rawBody,
    string $signatureHeader,
    string $timestampHeader,
    string $secret,
    int $toleranceSeconds = 300,
    ?int $now = null,
): bool {
    if ($signatureHeader === '' || $timestampHeader === '' || $secret === '') {
        return false;
    }

    if ($toleranceSeconds > 0) {
        if (!ctype_digit(ltrim($timestampHeader, '-')) || !is_numeric($timestampHeader)) {
            return false;
        }
        $ts = (int) $timestampHeader;
        $currentTime = $now ?? time();
        if (abs($currentTime - $ts) > $toleranceSeconds) {
            return false;
        }
    }

    $expected = 'sha256=' . hash_hmac('sha256', "{$timestampHeader}.{$rawBody}", $secret);

    return hash_equals($expected, $signatureHeader);
}
