/**
 * Client-context detection for audit-trail device/location reporting.
 *
 * The TurboDocx backend derives the signature audit trail's device + location
 * from the request's `User-Agent`, `X-Timezone`, `X-Forwarded-For` and
 * `X-Device-Fingerprint` headers (see backend `recordAuthInfo` /
 * `getTimezoneInfo`). When the SDK runs in a container/VM these should describe
 * that environment instead of defaulting to undici's "node" User-Agent (which
 * the backend records as device "Unknown") and a loopback/proxy IP (location
 * "Unknown").
 *
 * Everything here is best-effort and guarded: in a browser (no `os`/`process`)
 * it degrades to a bare SDK User-Agent rather than throwing. No runtime
 * dependencies — only Node built-ins, loaded lazily.
 */

export interface ClientContext {
  /** Override the auto-generated descriptive User-Agent. */
  userAgent?: string;
  /**
   * Client IP to report, sent as `X-Forwarded-For` to drive geolocation.
   * Opt-in: omitted by default so a container's private IP never overrides the
   * production load balancer's real public IP (X-Forwarded-For is left-most-wins).
   */
  ipAddress?: string;
  /** Override the auto-detected IANA timezone (sent as `X-Timezone`). */
  timezone?: string;
  /**
   * Override the auto-detected host language tag (BCP-47, e.g. "en-US"), sent as
   * `Accept-Language` so the audit trail records a real language instead of "N/A".
   */
  language?: string;
  /** Override the auto-generated device fingerprint (sent as `X-Device-Fingerprint`). */
  deviceFingerprint?: string;
}

function getSdkVersion(): string {
  try {
    // Resolves to packages/js-sdk/package.json from both src/ (ts-jest) and dist/.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../../package.json').version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Build a descriptive SDK User-Agent from the host environment, e.g.
 * `@turbodocx/sdk/0.4.0 (Node.js/v20.11.0; Linux 5.15.0; x64; host=svc-1)`.
 * Falls back to `@turbodocx/sdk/<version>` outside Node.
 */
export function buildDefaultUserAgent(): string {
  const base = `@turbodocx/sdk/${getSdkVersion()}`;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const os = require('os');
    const runtime =
      typeof process !== 'undefined' && process.version ? `Node.js/${process.version}` : 'Node.js';
    const osName = `${os.type()} ${os.release()}`.trim();
    return `${base} (${runtime}; ${osName}; ${os.arch()}; host=${os.hostname()})`;
  } catch {
    return base;
  }
}

/** Detect the host IANA timezone (e.g. "America/New_York"); "" if unavailable. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

/** Detect the host BCP-47 language tag (e.g. "en-US"); "" if unavailable. */
export function detectLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || '';
  } catch {
    return '';
  }
}

/**
 * Stable, non-reversible fingerprint of the host (hostname/platform/arch/mem).
 * Identifies the calling container/VM across requests without exposing raw host
 * details. Falls back to "" outside Node.
 */
export function buildDeviceFingerprint(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const os = require('os');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    const seed = [os.hostname(), os.platform(), os.arch(), String(os.totalmem())].join('|');
    return crypto.createHash('sha256').update(seed).digest('hex');
  } catch {
    return '';
  }
}

/**
 * Resolve the effective client-context request headers, applying caller
 * overrides over auto-detected host values.
 */
export function resolveClientContextHeaders(ctx: ClientContext = {}): Record<string, string> {
  const headers: Record<string, string> = {};

  headers['User-Agent'] = ctx.userAgent || buildDefaultUserAgent();

  const timezone = ctx.timezone || detectTimezone();
  if (timezone) headers['X-Timezone'] = timezone;

  const language = ctx.language || detectLocale();
  if (language) headers['Accept-Language'] = language;

  const fingerprint = ctx.deviceFingerprint || buildDeviceFingerprint();
  if (fingerprint) headers['X-Device-Fingerprint'] = fingerprint;

  // Opt-in only (see ClientContext.ipAddress).
  if (ctx.ipAddress) headers['X-Forwarded-For'] = ctx.ipAddress;

  return headers;
}
