<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;

/**
 * Request for updating an organization API key
 */
final class UpdateOrgApiKeyRequest
{
    /**
     * @param string|null $name New API key name (1-255 chars)
     * @param string|null $role New role
     */
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $role = null,
    ) {
        if ($this->name !== null) {
            $nameLength = mb_strlen($this->name);
            if ($nameLength < 1 || $nameLength > 255) {
                throw new ValidationException(
                    'API key name must be between 1 and 255 characters'
                );
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->name !== null) {
            $data['name'] = $this->name;
        }
        if ($this->role !== null) {
            $data['role'] = $this->role;
        }

        return $data;
    }
}
