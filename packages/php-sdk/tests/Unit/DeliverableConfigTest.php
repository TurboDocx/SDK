<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Config\DeliverableConfig;
use TurboDocx\Exceptions\AuthenticationException;

final class DeliverableConfigTest extends TestCase
{
    public function testCreateValidConfig(): void
    {
        $config = new DeliverableConfig(
            apiKey: 'test-api-key',
            orgId: 'test-org-id',
        );

        $this->assertEquals('test-api-key', $config->apiKey);
        $this->assertEquals('test-org-id', $config->orgId);
        $this->assertEquals('https://api.turbodocx.com', $config->baseUrl);
    }

    public function testDoesNotRequireSenderEmail(): void
    {
        // Should NOT throw - unlike HttpClientConfig
        $config = new DeliverableConfig(
            apiKey: 'test-api-key',
            orgId: 'test-org-id',
        );

        $this->assertNotNull($config);
    }

    public function testMissingAuthenticationThrowsException(): void
    {
        $this->expectException(AuthenticationException::class);

        new DeliverableConfig(
            orgId: 'test-org-id',
        );
    }

    public function testToHttpClientConfig(): void
    {
        $config = new DeliverableConfig(
            apiKey: 'test-api-key',
            orgId: 'test-org-id',
            baseUrl: 'https://custom.example.com',
        );

        $httpConfig = $config->toHttpClientConfig();

        $this->assertEquals('test-api-key', $httpConfig->apiKey);
        $this->assertEquals('test-org-id', $httpConfig->orgId);
        $this->assertEquals('https://custom.example.com', $httpConfig->baseUrl);
        $this->assertNull($httpConfig->senderEmail);
    }

    public function testFromEnvironment(): void
    {
        putenv('TURBODOCX_API_KEY=env-api-key');
        putenv('TURBODOCX_ORG_ID=env-org-id');
        putenv('TURBODOCX_BASE_URL=https://env.example.com');

        $config = DeliverableConfig::fromEnvironment();

        $this->assertEquals('env-api-key', $config->apiKey);
        $this->assertEquals('env-org-id', $config->orgId);
        $this->assertEquals('https://env.example.com', $config->baseUrl);

        // Cleanup
        putenv('TURBODOCX_API_KEY');
        putenv('TURBODOCX_ORG_ID');
        putenv('TURBODOCX_BASE_URL');
    }
}
