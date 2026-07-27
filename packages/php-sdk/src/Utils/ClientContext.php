<?php

declare(strict_types=1);

namespace TurboDocx\Utils;

/**
 * Client-context detection for audit-trail device/location reporting.
 *
 * The TurboDocx backend derives the signature audit trail's device + location
 * from the request's User-Agent, X-Timezone, Accept-Language, X-Forwarded-For
 * and X-Device-Fingerprint headers. When the SDK runs in a container/VM these
 * should describe that environment instead of defaulting to the HTTP library's
 * generic User-Agent (recorded as device "Unknown") and a loopback/proxy IP
 * (location "Unknown").
 *
 * The backend only classifies a request as an SDK call when the User-Agent
 * starts with the canonical "@turbodocx/sdk/<version>" token, so the
 * auto-generated User-Agent always uses that prefix.
 *
 * Everything here is best-effort: detection failures degrade to a bare SDK
 * User-Agent rather than throwing.
 */
final class ClientContext
{
    /**
     * @param string|null $userAgent        Override the auto-generated descriptive User-Agent.
     * @param string|null $ipAddress        Client IP reported as X-Forwarded-For to drive geolocation.
     *                                       Opt-in: omitted by default so a container's private IP never
     *                                       overrides the production load balancer's real public IP
     *                                       (X-Forwarded-For is leftmost-wins).
     * @param string|null $timezone         Override the auto-detected timezone (sent as X-Timezone).
     * @param string|null $language         Override the auto-detected BCP-47 tag (sent as Accept-Language).
     * @param string|null $deviceFingerprint Override the auto-generated device fingerprint.
     */
    public function __construct(
        public ?string $userAgent = null,
        public ?string $ipAddress = null,
        public ?string $timezone = null,
        public ?string $language = null,
        public ?string $deviceFingerprint = null,
    ) {}

    /**
     * Resolve the effective client-context request headers, applying caller
     * overrides over auto-detected host values.
     *
     * @return array<string, string>
     */
    public static function resolveHeaders(?self $ctx): array
    {
        $headers = [];

        $headers['User-Agent'] = ($ctx && $ctx->userAgent)
            ? $ctx->userAgent
            : self::buildDefaultUserAgent();

        $timezone = ($ctx && $ctx->timezone) ? $ctx->timezone : self::detectTimezone();
        if ($timezone !== '') {
            $headers['X-Timezone'] = $timezone;
        }

        $language = ($ctx && $ctx->language) ? $ctx->language : self::detectLocale();
        if ($language !== '') {
            $headers['Accept-Language'] = $language;
        }

        $fingerprint = ($ctx && $ctx->deviceFingerprint)
            ? $ctx->deviceFingerprint
            : self::buildDeviceFingerprint();
        if ($fingerprint !== '') {
            $headers['X-Device-Fingerprint'] = $fingerprint;
        }

        // Opt-in only (see $ipAddress).
        if ($ctx && $ctx->ipAddress) {
            $headers['X-Forwarded-For'] = $ctx->ipAddress;
        }

        return $headers;
    }

    private static function getSdkVersion(): string
    {
        try {
            $composer = dirname(__DIR__, 2) . '/composer.json';
            if (is_file($composer)) {
                /** @var array{version?: string} $data */
                $data = json_decode((string) file_get_contents($composer), true);
                if (is_array($data) && !empty($data['version'])) {
                    return (string) $data['version'];
                }
            }
        } catch (\Throwable) {
            // fall through
        }
        return '0.0.0';
    }

    /**
     * e.g. "@turbodocx/sdk/0.4.0 (PHP/8.3.6; Linux 5.15.0; x86_64; host=svc-1)".
     */
    private static function buildDefaultUserAgent(): string
    {
        $base = '@turbodocx/sdk/' . self::getSdkVersion();
        try {
            $runtime = 'PHP/' . PHP_VERSION;
            $osName = trim(php_uname('s') . ' ' . php_uname('r'));
            $arch = php_uname('m');
            $host = gethostname() ?: '';
            if ($host === '') {
                return $base;
            }
            return "{$base} ({$runtime}; {$osName}; {$arch}; host={$host})";
        } catch (\Throwable) {
            return $base;
        }
    }

    /** Detect the host timezone (IANA, e.g. "UTC"); "" if unavailable. */
    private static function detectTimezone(): string
    {
        return date_default_timezone_get() ?: '';
    }

    /** Detect the host BCP-47 language tag (e.g. "en-US"); "" if unavailable. */
    private static function detectLocale(): string
    {
        $raw = getenv('LC_ALL') ?: (getenv('LC_MESSAGES') ?: (getenv('LANG') ?: ''));
        if ($raw === '' && class_exists(\Locale::class)) {
            $raw = (string) \Locale::getDefault();
        }
        if ($raw === '') {
            return '';
        }
        // Strip encoding suffix ("en_US.UTF-8" -> "en_US") and normalize.
        $tag = trim(str_replace('_', '-', explode('.', $raw)[0]));
        $upper = strtoupper($tag);
        if ($tag === '' || $upper === 'C' || $upper === 'POSIX') {
            return '';
        }
        return $tag;
    }

    /** Stable, non-reversible fingerprint of the host; "" if unavailable. */
    private static function buildDeviceFingerprint(): string
    {
        try {
            $host = gethostname() ?: '';
            if ($host === '') {
                return '';
            }
            $seed = implode('|', [$host, php_uname('s'), php_uname('m')]);
            return hash('sha256', $seed);
        } catch (\Throwable) {
            return '';
        }
    }
}
