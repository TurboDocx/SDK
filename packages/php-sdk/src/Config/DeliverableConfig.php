<?php

declare(strict_types=1);

namespace TurboDocx\Config;

use TurboDocx\Exceptions\AuthenticationException;

/**
 * Configuration for the Deliverable module
 *
 * Unlike HttpClientConfig used directly, this does NOT require senderEmail.
 */
final class DeliverableConfig
{
    /**
     * @param string|null $apiKey TurboDocx API key
     * @param string|null $accessToken OAuth access token (alternative to apiKey)
     * @param string $baseUrl API base URL
     * @param string|null $orgId Organization ID
     */
    public function __construct(
        public ?string $apiKey = null,
        public ?string $accessToken = null,
        public string $baseUrl = 'https://api.turbodocx.com',
        public ?string $orgId = null,
    ) {
        if (empty($this->apiKey) && empty($this->accessToken)) {
            throw new AuthenticationException('API key or access token is required');
        }
    }

    /**
     * Create configuration from environment variables
     *
     * @return self
     */
    public static function fromEnvironment(): self
    {
        return new self(
            apiKey: getenv('TURBODOCX_API_KEY') ?: null,
            accessToken: getenv('TURBODOCX_ACCESS_TOKEN') ?: null,
            baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com',
            orgId: getenv('TURBODOCX_ORG_ID') ?: null,
        );
    }

    /**
     * Convert to HttpClientConfig for use with HttpClient
     *
     * @return HttpClientConfig
     */
    public function toHttpClientConfig(): HttpClientConfig
    {
        return new HttpClientConfig(
            apiKey: $this->apiKey,
            accessToken: $this->accessToken,
            baseUrl: $this->baseUrl,
            orgId: $this->orgId,
            skipSenderValidation: true,
        );
    }
}
