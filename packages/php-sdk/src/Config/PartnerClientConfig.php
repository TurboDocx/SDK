<?php

declare(strict_types=1);

namespace TurboDocx\Config;

use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\ValidationException;

/**
 * Configuration for the TurboPartner HTTP client
 */
final class PartnerClientConfig
{
    /**
     * @param string $partnerApiKey Partner API key (must start with TDXP-)
     * @param string $partnerId Partner UUID
     * @param string $baseUrl API base URL
     */
    public function __construct(
        public readonly string $partnerApiKey,
        public readonly string $partnerId,
        public readonly string $baseUrl = 'https://api.turbodocx.com',
    ) {
        if (empty($this->partnerApiKey)) {
            throw new AuthenticationException('Partner API key is required');
        }

        if (!str_starts_with($this->partnerApiKey, 'TDXP-')) {
            throw new AuthenticationException(
                'Partner API key must start with TDXP- prefix'
            );
        }

        if (empty($this->partnerId)) {
            throw new ValidationException('Partner ID is required');
        }

        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $this->partnerId)) {
            throw new ValidationException('Partner ID must be a valid UUID');
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
            partnerApiKey: getenv('TURBODOCX_PARTNER_API_KEY') ?: '',
            partnerId: getenv('TURBODOCX_PARTNER_ID') ?: '',
            baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com',
        );
    }
}
