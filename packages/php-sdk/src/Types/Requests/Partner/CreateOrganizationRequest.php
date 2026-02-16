<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;

/**
 * Request for creating a new organization
 */
final class CreateOrganizationRequest
{
    /**
     * @param string $name Organization name (1-255 chars)
     * @param array<string, mixed>|null $metadata Optional metadata
     * @param array<string, mixed>|null $features Optional entitlements override
     */
    public function __construct(
        public readonly string $name,
        public readonly ?array $metadata = null,
        public readonly ?array $features = null,
    ) {
        $nameLength = mb_strlen($this->name);
        if ($nameLength < 1 || $nameLength > 255) {
            throw new ValidationException(
                'Organization name must be between 1 and 255 characters'
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = ['name' => $this->name];

        if ($this->metadata !== null) {
            $data['metadata'] = $this->metadata;
        }
        if ($this->features !== null) {
            $data['features'] = $this->features;
        }

        return $data;
    }
}
