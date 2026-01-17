<?php

declare(strict_types=1);

namespace TurboDocx\Config;

use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\ValidationException;

/**
 * Configuration for the TurboDocx HTTP client
 */
final class HttpClientConfig
{
    /**
     * @param string|null $apiKey TurboDocx API key
     * @param string|null $accessToken OAuth access token (alternative to apiKey)
     * @param string $baseUrl API base URL
     * @param string|null $orgId Organization ID
     * @param string|null $senderEmail Reply-to email address for signature requests (required)
     * @param string|null $senderName Sender name for signature requests (optional but recommended)
     */
    public function __construct(
        public ?string $apiKey = null,
        public ?string $accessToken = null,
        public string $baseUrl = 'https://api.turbodocx.com',
        public ?string $orgId = null,
        public ?string $senderEmail = null,
        public ?string $senderName = null,
    ) {
        // Validate required fields
        if (empty($this->apiKey) && empty($this->accessToken)) {
            throw new AuthenticationException('API key or access token is required');
        }

        if (empty($this->senderEmail)) {
            throw new ValidationException(
                'senderEmail is required. This email will be used as the reply-to address for signature requests. '
                . 'Without it, emails will default to "API Service User via TurboSign".'
            );
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
            senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: null,
            senderName: getenv('TURBODOCX_SENDER_NAME') ?: null,
        );
    }
}
