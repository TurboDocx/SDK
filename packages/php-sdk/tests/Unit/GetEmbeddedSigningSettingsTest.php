<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use TurboDocx\TurboSign;

/**
 * Tests for TurboSign::getEmbeddedSigningSettings — the read-only org gates.
 *
 * Mirrors the js-sdk suite: double-envelope unwrap plus the org gate fields. Also locks the
 * explicit bool casts: the backend's MySQL tinyint columns can arrive as int 0/1, which the
 * ResponseNormalizer does NOT coerce for these keys, so fromArray must cast them itself.
 */
final class GetEmbeddedSigningSettingsTest extends TestCase
{
    use EmbeddedSigningTestSupport;

    protected function tearDown(): void
    {
        $this->resetTurboSignClient();
    }

    public function testReturnsOrgGatesFromDoubleEnvelope(): void
    {
        // Arrange: { data: { results: {...} } } envelope with native JSON booleans.
        $this->injectTurboSignClient([
            new Response(200, [], (string) json_encode([
                'data' => ['results' => [
                    'enabled' => true,
                    'allowExternalIdv' => true,
                    'allowIdentityOverride' => false,
                    'defaultChannel' => 'email',
                    'allowedFrameAncestors' => ['https://app.example.com'],
                ]],
            ])),
        ]);

        // Act
        $settings = TurboSign::getEmbeddedSigningSettings();

        // Assert
        $this->assertTrue($settings->enabled);
        $this->assertTrue($settings->allowExternalIdv);
        $this->assertFalse($settings->allowIdentityOverride);
        $this->assertSame('email', $settings->defaultChannel);
        $this->assertSame(['https://app.example.com'], $settings->allowedFrameAncestors);
    }

    public function testCoercesTinyintGatesToBooleans(): void
    {
        // Arrange: the backend returns tinyint 0/1 for the boolean gates. Under strict_types these
        // would TypeError against the promoted `bool` params unless fromArray casts them.
        $this->injectTurboSignClient([
            new Response(200, [], (string) json_encode([
                'data' => ['results' => [
                    'enabled' => 1,
                    'allowExternalIdv' => 0,
                    'allowIdentityOverride' => 1,
                    'defaultChannel' => 'none',
                    'allowedFrameAncestors' => [],
                ]],
            ])),
        ]);

        // Act
        $settings = TurboSign::getEmbeddedSigningSettings();

        // Assert: ints became real booleans; no TypeError thrown.
        $this->assertTrue($settings->enabled);
        $this->assertFalse($settings->allowExternalIdv);
        $this->assertTrue($settings->allowIdentityOverride);
        $this->assertSame('none', $settings->defaultChannel);
        $this->assertSame([], $settings->allowedFrameAncestors);
    }

    public function testDefaultsMissingFieldsSafely(): void
    {
        // Arrange: a sparse payload — missing gates default to false, missing channel to null.
        $this->injectTurboSignClient([
            new Response(200, [], (string) json_encode(['data' => ['results' => ['enabled' => true]]])),
        ]);

        // Act
        $settings = TurboSign::getEmbeddedSigningSettings();

        // Assert
        $this->assertTrue($settings->enabled);
        $this->assertFalse($settings->allowExternalIdv);
        $this->assertFalse($settings->allowIdentityOverride);
        $this->assertNull($settings->defaultChannel);
        $this->assertSame([], $settings->allowedFrameAncestors);
    }
}
