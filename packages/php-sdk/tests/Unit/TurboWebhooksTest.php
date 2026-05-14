<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use ReflectionClass;
use RuntimeException;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\AuthorizationException;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\TurboWebhooks;

use function TurboDocx\Utils\verifyWebhookSignature;

/**
 * Tests for TurboWebhooks module.
 *
 * The PHP SDK convention (per existing tests) is to cover config + types +
 * exceptions rather than full HTTP mocking (Guzzle mock setup is not used
 * elsewhere). These tests cover:
 *   - AuthorizationException hierarchy + status code
 *   - TurboWebhooks::configure() and configureFromCredentials()
 *   - Lazy getClient() env-var fallback (success + missing-env error)
 *   - verifyWebhookSignature() pure-function helper
 */
final class TurboWebhooksTest extends TestCase
{
    private const ENV_VARS = [
        'TURBODOCX_API_KEY',
        'TURBODOCX_ORG_ID',
        'TURBODOCX_BASE_URL',
    ];

    protected function setUp(): void
    {
        // Reset the static client so each test starts clean.
        $ref = new ReflectionClass(TurboWebhooks::class);
        $prop = $ref->getProperty('client');
        $prop->setAccessible(true);
        $prop->setValue(null, null);

        // Clear env vars
        foreach (self::ENV_VARS as $var) {
            putenv($var);
            unset($_ENV[$var], $_SERVER[$var]);
        }
    }

    protected function tearDown(): void
    {
        $this->setUp();
    }

    // ============================================
    // AuthorizationException
    // ============================================

    public function testAuthorizationExceptionExtendsTurboDocxException(): void
    {
        $e = new AuthorizationException('Forbidden');
        $this->assertInstanceOf(TurboDocxException::class, $e);
        $this->assertSame(403, $e->statusCode);
        $this->assertSame('AUTHORIZATION_ERROR', $e->errorCode);
    }

    public function testAuthorizationExceptionDefaultMessage(): void
    {
        $e = new AuthorizationException();
        $this->assertStringContainsString('Forbidden', $e->getMessage());
    }

    // ============================================
    // configure() / configureFromCredentials()
    // ============================================

    public function testConfigureAcceptsHttpClientConfigWithSkipSenderValidation(): void
    {
        $config = new HttpClientConfig(
            apiKey: 'TDX-test',
            orgId: 'org-1',
            skipSenderValidation: true,
        );
        TurboWebhooks::configure($config);

        // Client is set; calling list() now would attempt a real HTTP call,
        // but we only need to confirm no exception was raised on configure.
        $this->assertTrue(true);
    }

    public function testConfigureFromCredentialsSetsClientWithoutRequiringSenderEmail(): void
    {
        TurboWebhooks::configureFromCredentials(
            apiKey: 'TDX-test',
            orgId: 'org-1',
            baseUrl: 'http://localhost:3000',
        );

        $ref = new ReflectionClass(TurboWebhooks::class);
        $prop = $ref->getProperty('client');
        $prop->setAccessible(true);
        $this->assertNotNull($prop->getValue());
    }

    // ============================================
    // Lazy getClient() env-var fallback
    // ============================================

    public function testGetClientThrowsWhenEnvVarsMissing(): void
    {
        $ref = new ReflectionClass(TurboWebhooks::class);
        $method = $ref->getMethod('getClient');
        $method->setAccessible(true);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('TurboWebhooks not configured');

        $method->invoke(null);
    }

    public function testGetClientAutoConfiguresFromEnvVars(): void
    {
        putenv('TURBODOCX_API_KEY=TDX-env-key');
        putenv('TURBODOCX_ORG_ID=env-org-id');

        $ref = new ReflectionClass(TurboWebhooks::class);
        $method = $ref->getMethod('getClient');
        $method->setAccessible(true);

        $client = $method->invoke(null);

        $this->assertNotNull($client);
    }

    // ============================================
    // verifyWebhookSignature
    // ============================================

    private const SECRET = 'whsec_test_secret_xyz';
    private const BODY = '{"event":"signature.document.completed","documentId":"doc-1"}';
    private const NOW_SECONDS = 1747000000;

    private static function sign(string $body, string $timestamp, string $secret): string
    {
        return 'sha256=' . hash_hmac('sha256', "{$timestamp}.{$body}", $secret);
    }

    public function testVerifyAcceptsValidSignatureWithinWindow(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $sig = self::sign(self::BODY, $ts, self::SECRET);
        $this->assertTrue(
            verifyWebhookSignature(self::BODY, $sig, $ts, self::SECRET, 300, self::NOW_SECONDS),
        );
    }

    public function testVerifyRejectsTamperedBody(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $sig = self::sign(self::BODY, $ts, self::SECRET);
        $this->assertFalse(
            verifyWebhookSignature(self::BODY . 'tampered', $sig, $ts, self::SECRET, 300, self::NOW_SECONDS),
        );
    }

    public function testVerifyRejectsStaleTimestamp(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $sig = self::sign(self::BODY, $ts, self::SECRET);
        // Current time 301 seconds ahead — past 300s tolerance
        $this->assertFalse(
            verifyWebhookSignature(self::BODY, $sig, $ts, self::SECRET, 300, self::NOW_SECONDS + 301),
        );
    }

    public function testVerifyRejectsFutureTimestamp(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $sig = self::sign(self::BODY, $ts, self::SECRET);
        $this->assertFalse(
            verifyWebhookSignature(self::BODY, $sig, $ts, self::SECRET, 300, self::NOW_SECONDS - 301),
        );
    }

    public function testVerifyZeroToleranceDisablesCheck(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $sig = self::sign(self::BODY, $ts, self::SECRET);
        $this->assertTrue(
            verifyWebhookSignature(self::BODY, $sig, $ts, self::SECRET, 0, self::NOW_SECONDS + 99999),
        );
    }

    public function testVerifyRejectsEmptySignature(): void
    {
        $this->assertFalse(
            verifyWebhookSignature(self::BODY, '', (string) self::NOW_SECONDS, self::SECRET),
        );
    }

    public function testVerifyRejectsEmptyTimestamp(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $sig = self::sign(self::BODY, $ts, self::SECRET);
        $this->assertFalse(verifyWebhookSignature(self::BODY, $sig, '', self::SECRET));
    }

    public function testVerifyRejectsEmptySecret(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $sig = self::sign(self::BODY, $ts, self::SECRET);
        $this->assertFalse(verifyWebhookSignature(self::BODY, $sig, $ts, ''));
    }

    public function testVerifyRejectsNonNumericTimestamp(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $sig = self::sign(self::BODY, $ts, self::SECRET);
        $this->assertFalse(
            verifyWebhookSignature(self::BODY, $sig, 'not-a-number', self::SECRET, 300, self::NOW_SECONDS),
        );
    }

    public function testVerifyRejectsLengthMismatchedSignature(): void
    {
        $ts = (string) self::NOW_SECONDS;
        $this->assertFalse(
            verifyWebhookSignature(self::BODY, 'sha256=short', $ts, self::SECRET, 300, self::NOW_SECONDS),
        );
    }
}
