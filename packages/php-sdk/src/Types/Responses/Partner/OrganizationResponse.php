<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\Organization;

/**
 * Response from creating or updating an organization
 */
final class OrganizationResponse implements \JsonSerializable
{
    public function __construct(
        public readonly bool $success,
        public readonly Organization $data,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $orgData = $data['data'] ?? $data;

        return new self(
            success: (bool) ($data['success'] ?? true),
            data: Organization::fromArray($orgData),
        );
    }

    /**
     * Convert to array for serialization
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'data' => $this->data->toArray(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
