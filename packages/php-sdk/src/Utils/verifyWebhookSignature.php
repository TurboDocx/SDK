<?php

declare(strict_types=1);

namespace TurboDocx\Utils;

/**
 * Webhook signature verification helper.
 *
 * Verifies the X-TurboDocx-Signature header on an incoming webhook delivery.
 * Format matches how TurboDocx signs each delivery:
 *   - Header:        X-TurboDocx-Signature: sha256=<hex>
 *   - Timestamp:     X-TurboDocx-Timestamp: <unix-seconds>
 *   - String signed: "{$timestamp}.{$rawBody}"
 *   - Algorithm:     HMAC-SHA256
 *
 * Enforces a configurable timestamp tolerance (default 300s) to prevent
 * replay attacks. Uses hash_equals for constant-time comparison.
 *
 * Every request-derived argument is typed `mixed` so a missing header (null,
 * e.g. Laravel's `$request->header()`) or a PSR-7 `getHeader()` value
 * (string[]) returns false instead of throwing TypeError: a receiver answers
 * 401, not 500.
 *
 * @param mixed  $rawBody          The raw request body bytes AS RECEIVED, as a
 *                                 string. Do NOT json_decode first; do NOT
 *                                 re-encode. Whitespace must match exactly.
 * @param mixed  $signatureHeader  Value of the `X-TurboDocx-Signature` header
 *                                 (format: "sha256=<hex>"), as a string.
 * @param mixed  $timestampHeader  Value of the `X-TurboDocx-Timestamp`
 *                                 header (Unix epoch seconds), as a string.
 * @param mixed  $secret           Webhook secret returned by createWebhook
 *                                 or regenerateWebhookSecret, as a string.
 * @param int    $toleranceSeconds Maximum acceptable age of the timestamp,
 *                                 in seconds. Defaults to 300 (5 minutes).
 *                                 Set to 0 to disable the timestamp check
 *                                 (NOT recommended in production).
 * @param int|null $now            Override the "current time" (Unix seconds)
 *                                 for deterministic testing. Defaults to
 *                                 time().
 *
 * @return bool true iff the signature is valid AND the timestamp is within
 *              tolerance. Constant-time comparison; returns false (never
 *              throws) on bad input, including a non-string argument.
 */
function verifyWebhookSignature(
    mixed $rawBody,
    mixed $signatureHeader,
    mixed $timestampHeader,
    mixed $secret,
    int $toleranceSeconds = 300,
    ?int $now = null,
): bool {
    if (!is_string($rawBody) || !is_string($signatureHeader) || !is_string($timestampHeader) || !is_string($secret)) {
        return false;
    }

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
