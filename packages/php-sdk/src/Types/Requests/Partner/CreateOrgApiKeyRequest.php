<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;

/**
 * Request for creating an organization API key
 */
final class CreateOrgApiKeyRequest
{
    /**
     * @param string $name API key name (1-255 chars)
     * @param string $role API key role
     */
    public function __construct(
        public readonly string $name,
        public readonly string $role,
    ) {
        $nameLength = mb_strlen($this->name);
        if ($nameLength < 1 || $nameLength > 255) {
            throw new ValidationException(
                'API key name must be between 1 and 255 characters'
            );
        }
    }

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'role' => $this->role,
        ];
    }
}
