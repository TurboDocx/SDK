<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use ReflectionClass;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\HttpClient;
use TurboDocx\Utils\ClientContext;

/**
 * Client-context header tests (parity with JS tests/http-client-context.test.ts).
 *
 * The audit trail records device/location from request headers. The SDK must
 * send a descriptive User-Agent starting with "@turbodocx/sdk/", a timezone, a
 * language, an optional client IP (X-Forwarded-For -> geolocation), and a
 * device fingerprint.
 */
final class ClientContextTest extends TestCase
{
    public function testSendsDescriptiveTurboDocxSdkUserAgentByDefault(): void
    {
        $headers = ClientContext::resolveHeaders(null);
        $this->assertStringStartsWith('@turbodocx/sdk/', $headers['User-Agent']);
        $this->assertStringNotContainsString('GuzzleHttp', $headers['User-Agent']);
    }

    public function testLetsCallerOverrideUserAgent(): void
    {
        $headers = ClientContext::resolveHeaders(new ClientContext(userAgent: 'my-app/9.9 (worker)'));
        $this->assertSame('my-app/9.9 (worker)', $headers['User-Agent']);
    }

    public function testSendsAcceptLanguageFromHostLocaleByDefault(): void
    {
        $prevAll = getenv('LC_ALL');
        $prevMsg = getenv('LC_MESSAGES');
        $prevLang = getenv('LANG');
        putenv('LC_ALL');
        putenv('LC_MESSAGES');
        putenv('LANG=en_US.UTF-8');
        try {
            $headers = ClientContext::resolveHeaders(null);
            $this->assertSame('en-US', $headers['Accept-Language']);
        } finally {
            $prevAll === false ? putenv('LC_ALL') : putenv("LC_ALL={$prevAll}");
            $prevMsg === false ? putenv('LC_MESSAGES') : putenv("LC_MESSAGES={$prevMsg}");
            $prevLang === false ? putenv('LANG') : putenv("LANG={$prevLang}");
        }
    }

    public function testLetsCallerOverrideLanguage(): void
    {
        $headers = ClientContext::resolveHeaders(new ClientContext(language: 'fr-FR'));
        $this->assertSame('fr-FR', $headers['Accept-Language']);
    }

    public function testLetsCallerOverrideTimezone(): void
    {
        $headers = ClientContext::resolveHeaders(new ClientContext(timezone: 'America/New_York'));
        $this->assertSame('America/New_York', $headers['X-Timezone']);
    }

    public function testDoesNotSendForwardedForByDefault(): void
    {
        $headers = ClientContext::resolveHeaders(null);
        $this->assertArrayNotHasKey('X-Forwarded-For', $headers);
    }

    public function testSendsForwardedForWhenCallerSuppliesIp(): void
    {
        $headers = ClientContext::resolveHeaders(new ClientContext(ipAddress: '203.0.113.7'));
        $this->assertSame('203.0.113.7', $headers['X-Forwarded-For']);
    }

    public function testSendsDeviceFingerprintByDefaultAndHonorsOverride(): void
    {
        $headers = ClientContext::resolveHeaders(null);
        $this->assertNotEmpty($headers['X-Device-Fingerprint']);

        $headers = ClientContext::resolveHeaders(new ClientContext(deviceFingerprint: 'fp-abc'));
        $this->assertSame('fp-abc', $headers['X-Device-Fingerprint']);
    }

    public function testHttpClientWiresContextIntoDefaultHeaders(): void
    {
        $config = new HttpClientConfig(
            apiKey: 'TDX-test',
            orgId: 'org-1',
            skipSenderValidation: true,
            clientContext: new ClientContext(ipAddress: '203.0.113.7'),
        );
        $http = new HttpClient($config);

        $ref = new ReflectionClass($http);
        $method = $ref->getMethod('getHeaders');
        $method->setAccessible(true);
        /** @var array<string, string> $headers */
        $headers = $method->invoke($http, $config);

        $this->assertStringStartsWith('@turbodocx/sdk/', $headers['User-Agent']);
        $this->assertSame('203.0.113.7', $headers['X-Forwarded-For']);
        // SDK protocol headers still win.
        $this->assertSame('application/json', $headers['Content-Type']);
        $this->assertSame('Bearer TDX-test', $headers['Authorization']);
        $this->assertSame('org-1', $headers['x-rapiddocx-org-id']);
    }
}
