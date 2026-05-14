/**
 * Webhook signature verification helper.
 *
 * Verifies the `X-TurboDocx-Signature` header on an incoming webhook delivery.
 * Format matches the backend's `webhookService.generateSignature`:
 *   - Header:        `X-TurboDocx-Signature: sha256=<hex>`
 *   - Timestamp:     `X-TurboDocx-Timestamp: <unix-seconds>`
 *   - String signed: `${timestamp}.${rawBody}`
 *   - Algorithm:     HMAC-SHA256
 *
 * Enforces a configurable timestamp tolerance (default 300s) to prevent
 * replay attacks. Uses constant-time comparison.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface VerifyWebhookSignatureOptions {
  /**
   * Maximum acceptable age of the timestamp header, in seconds.
   * Defaults to 300 (5 minutes). Set to 0 to disable the timestamp check
   * (NOT recommended in production).
   */
  toleranceSeconds?: number;

  /**
   * Override the "current time" function for deterministic testing.
   * Returns Unix epoch seconds. Defaults to `Math.floor(Date.now() / 1000)`.
   */
  now?: () => number;
}

/**
 * Verify a TurboDocx webhook delivery.
 *
 * @param rawBody         - the raw request body, AS RECEIVED. Do NOT
 *                          `JSON.parse` first; do NOT re-stringify. Whitespace
 *                          must match exactly. Use a body parser that
 *                          preserves the raw bytes (e.g.
 *                          `express.raw({ type: "application/json" })`).
 * @param signatureHeader - value of the `X-TurboDocx-Signature` header
 *                          (format: `sha256=<hex>`).
 * @param timestampHeader - value of the `X-TurboDocx-Timestamp` header
 *                          (Unix epoch seconds, as string).
 * @param secret          - webhook secret returned by `createWebhook` or
 *                          `regenerateWebhookSecret`.
 * @param options         - optional tolerance + `now` overrides.
 * @returns               - true iff the signature is valid AND the timestamp
 *                          is within tolerance.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string,
  timestampHeader: string,
  secret: string,
  options: VerifyWebhookSignatureOptions = {},
): boolean {
  if (!signatureHeader || !timestampHeader || !secret) return false;

  const toleranceSeconds = options.toleranceSeconds ?? 300;
  if (toleranceSeconds > 0) {
    const now = options.now ? options.now() : Math.floor(Date.now() / 1000);
    const ts = Number.parseInt(timestampHeader, 10);
    if (!Number.isFinite(ts)) return false;
    if (Math.abs(now - ts) > toleranceSeconds) return false;
  }

  const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expected =
    'sha256=' +
    createHmac('sha256', secret).update(`${timestampHeader}.${bodyString}`, 'utf8').digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signatureHeader, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
