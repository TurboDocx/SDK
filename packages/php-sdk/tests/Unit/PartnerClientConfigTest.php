<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\ValidationException;

final class PartnerClientConfigTest extends TestCase
{
    public function testCreateValidConfig(): void
    {
        $config = new PartnerClientConfig(
            partnerApiKey: 'TDXP-test-api-key-12345',
            partnerId: '12345678-1234-1234-1234-123456789012'
        );

        $this->assertEquals('TDXP-test-api-key-12345', $config->partnerApiKey);
        $this->assertEquals('12345678-1234-1234-1234-123456789012', $config->partnerId);
        $this->assertEquals('https://api.turbodocx.com', $config->baseUrl);
    }

    public function testCreateConfigWithCustomBaseUrl(): void
    {
        $config = new PartnerClientConfig(
            partnerApiKey: 'TDXP-test-api-key-12345',
            partnerId: '12345678-1234-1234-1234-123456789012',
            baseUrl: 'https://custom.example.com'
        );

        $this->assertEquals('https://custom.example.com', $config->baseUrl);
    }

    public function testMissingApiKeyThrowsException(): void
    {
        $this->expectException(AuthenticationException::class);
        $this->expectExceptionMessage('Partner API key is required');

        new PartnerClientConfig(
            partnerApiKey: '',
            partnerId: '12345678-1234-1234-1234-123456789012'
        );
    }

    public function testInvalidApiKeyPrefixThrowsException(): void
    {
        $this->expectException(AuthenticationException::class);
        $this->expectExceptionMessage('Partner API key must start with TDXP- prefix');

        new PartnerClientConfig(
            partnerApiKey: 'invalid-api-key',
            partnerId: '12345678-1234-1234-1234-123456789012'
        );
    }

    public function testMissingPartnerIdThrowsException(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Partner ID is required');

        new PartnerClientConfig(
            partnerApiKey: 'TDXP-test-api-key-12345',
            partnerId: ''
        );
    }

    public function testInvalidPartnerIdFormatThrowsException(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Partner ID must be a valid UUID');

        new PartnerClientConfig(
            partnerApiKey: 'TDXP-test-api-key-12345',
            partnerId: 'not-a-valid-uuid'
        );
    }

    public function testFromEnvironment(): void
    {
        // Set environment variables
        putenv('TURBODOCX_PARTNER_API_KEY=TDXP-env-api-key-12345');
        putenv('TURBODOCX_PARTNER_ID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
        putenv('TURBODOCX_BASE_URL=https://env.example.com');

        $config = PartnerClientConfig::fromEnvironment();

        $this->assertEquals('TDXP-env-api-key-12345', $config->partnerApiKey);
        $this->assertEquals('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', $config->partnerId);
        $this->assertEquals('https://env.example.com', $config->baseUrl);

        // Cleanup
        putenv('TURBODOCX_PARTNER_API_KEY');
        putenv('TURBODOCX_PARTNER_ID');
        putenv('TURBODOCX_BASE_URL');
    }

    public function testFromEnvironmentWithDefaultBaseUrl(): void
    {
        // Set environment variables without BASE_URL
        putenv('TURBODOCX_PARTNER_API_KEY=TDXP-env-api-key-12345');
        putenv('TURBODOCX_PARTNER_ID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
        putenv('TURBODOCX_BASE_URL');

        $config = PartnerClientConfig::fromEnvironment();

        $this->assertEquals('https://api.turbodocx.com', $config->baseUrl);

        // Cleanup
        putenv('TURBODOCX_PARTNER_API_KEY');
        putenv('TURBODOCX_PARTNER_ID');
    }
}
