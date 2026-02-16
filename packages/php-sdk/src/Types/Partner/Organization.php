<?php

declare(strict_types=1);

namespace TurboDocx\Types\Partner;

/**
 * Organization domain type
 */
final class Organization implements \JsonSerializable
{
    /**
     * @param array<string, mixed>|null $metadata
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly ?string $partnerId = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?string $createdBy = null,
        public readonly ?bool $isActive = null,
        public readonly ?int $userCount = null,
        public readonly ?int $storageUsed = null,
        public readonly ?array $metadata = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            name: $data['name'] ?? '',
            partnerId: $data['partnerId'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            createdBy: $data['createdBy'] ?? null,
            isActive: isset($data['isActive']) ? (bool) $data['isActive'] : null,
            userCount: isset($data['userCount']) ? (int) $data['userCount'] : null,
            storageUsed: isset($data['storageUsed']) ? (int) $data['storageUsed'] : null,
            metadata: $data['metadata'] ?? null,
        );
    }

    /**
     * Convert to array, filtering out null values
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'id' => $this->id,
            'name' => $this->name,
            'partnerId' => $this->partnerId,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
            'createdBy' => $this->createdBy,
            'isActive' => $this->isActive,
            'userCount' => $this->userCount,
            'storageUsed' => $this->storageUsed,
            'metadata' => $this->metadata,
        ], fn($value) => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
