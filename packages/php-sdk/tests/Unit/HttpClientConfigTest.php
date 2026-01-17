<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\ValidationException;

final class HttpClientConfigTest extends TestCase
{
    public function testCreateValidConfig(): void
    {
        $config = new HttpClientConfig(
            apiKey: 'test-api-key',
            orgId: 'test-org-id',
            senderEmail: 'test@example.com',
            senderName: 'Test Company'
        );

        $this->assertEquals('test-api-key', $config->apiKey);
        $this->assertEquals('test-org-id', $config->orgId);
        $this->assertEquals('test@example.com', $config->senderEmail);
        $this->assertEquals('Test Company', $config->senderName);
        $this->assertEquals('https://api.turbodocx.com', $config->baseUrl);
    }

    public function testCreateConfigWithAccessToken(): void
    {
        $config = new HttpClientConfig(
            accessToken: 'test-access-token',
            orgId: 'test-org-id',
            senderEmail: 'test@example.com'
        );

        $this->assertEquals('test-access-token', $config->accessToken);
        $this->assertNull($config->apiKey);
    }

    public function testCreateConfigWithCustomBaseUrl(): void
    {
        $config = new HttpClientConfig(
            apiKey: 'test-api-key',
            orgId: 'test-org-id',
            senderEmail: 'test@example.com',
            baseUrl: 'https://custom.example.com'
        );

        $this->assertEquals('https://custom.example.com', $config->baseUrl);
    }

    public function testMissingAuthenticationThrowsException(): void
    {
        $this->expectException(AuthenticationException::class);
        $this->expectExceptionMessage('API key or access token is required');

        new HttpClientConfig(
            orgId: 'test-org-id',
            senderEmail: 'test@example.com'
        );
    }

    public function testMissingSenderEmailThrowsException(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('senderEmail is required');

        new HttpClientConfig(
            apiKey: 'test-api-key',
            orgId: 'test-org-id'
        );
    }

    public function testFromEnvironment(): void
    {
        // Set environment variables
        putenv('TURBODOCX_API_KEY=env-api-key');
        putenv('TURBODOCX_ORG_ID=env-org-id');
        putenv('TURBODOCX_SENDER_EMAIL=env@example.com');
        putenv('TURBODOCX_SENDER_NAME=Env Company');
        putenv('TURBODOCX_BASE_URL=https://env.example.com');

        $config = HttpClientConfig::fromEnvironment();

        $this->assertEquals('env-api-key', $config->apiKey);
        $this->assertEquals('env-org-id', $config->orgId);
        $this->assertEquals('env@example.com', $config->senderEmail);
        $this->assertEquals('Env Company', $config->senderName);
        $this->assertEquals('https://env.example.com', $config->baseUrl);

        // Cleanup
        putenv('TURBODOCX_API_KEY');
        putenv('TURBODOCX_ORG_ID');
        putenv('TURBODOCX_SENDER_EMAIL');
        putenv('TURBODOCX_SENDER_NAME');
        putenv('TURBODOCX_BASE_URL');
    }
}
