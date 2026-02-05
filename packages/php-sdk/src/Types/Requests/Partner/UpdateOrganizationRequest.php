<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;

/**
 * Request for updating an organization
 */
final class UpdateOrganizationRequest
{
    /**
     * @param string $name New organization name (1-255 chars)
     */
    public function __construct(
        public readonly string $name,
    ) {
        $nameLength = mb_strlen($this->name);
        if ($nameLength < 1 || $nameLength > 255) {
            throw new ValidationException(
                'Organization name must be between 1 and 255 characters'
            );
        }
    }

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return ['name' => $this->name];
    }
}
