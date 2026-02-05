<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\Enums\PartnerScope;

/**
 * Request for creating a partner API key
 */
final class CreatePartnerApiKeyRequest
{
    /**
     * @param string $name API key name (1-255 chars)
     * @param array<PartnerScope> $scopes Required scopes (at least one)
     * @param string|null $description Optional description
     * @param array<string>|null $ipWhitelist Optional IP whitelist (IPv4 addresses)
     * @param array<string>|null $allowedOrigins Optional allowed origins (URIs)
     */
    public function __construct(
        public readonly string $name,
        public readonly array $scopes,
        public readonly ?string $description = null,
        public readonly ?array $ipWhitelist = null,
        public readonly ?array $allowedOrigins = null,
    ) {
        $nameLength = mb_strlen($this->name);
        if ($nameLength < 1 || $nameLength > 255) {
            throw new ValidationException(
                'API key name must be between 1 and 255 characters'
            );
        }

        if (empty($this->scopes)) {
            throw new ValidationException('At least one scope is required');
        }

        foreach ($this->scopes as $scope) {
            if (!$scope instanceof PartnerScope) {
                throw new ValidationException('All scopes must be PartnerScope enum values');
            }
        }

        if ($this->ipWhitelist !== null) {
            foreach ($this->ipWhitelist as $ip) {
                if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
                    throw new ValidationException("Invalid IPv4 address: {$ip}");
                }
            }
        }

        if ($this->allowedOrigins !== null) {
            foreach ($this->allowedOrigins as $origin) {
                if (!filter_var($origin, FILTER_VALIDATE_URL)) {
                    throw new ValidationException("Invalid URI: {$origin}");
                }
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'scopes' => array_map(fn(PartnerScope $s) => $s->value, $this->scopes),
        ];

        if ($this->description !== null) {
            $data['description'] = $this->description;
        }
        if ($this->ipWhitelist !== null) {
            $data['ipWhitelist'] = $this->ipWhitelist;
        }
        if ($this->allowedOrigins !== null) {
            $data['allowedOrigins'] = $this->allowedOrigins;
        }

        return $data;
    }
}
