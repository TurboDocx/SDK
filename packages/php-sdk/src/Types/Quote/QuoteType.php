<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Type/Category domain type
 */
final class QuoteType implements \JsonSerializable
{
    /**
     * @param array{inUse: bool, usageCount: int, usedIn: string[]}|null $usage
     */
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $name,
        public readonly string $categoryType,
        public readonly bool $isDefault = false,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?array $usage = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            orgId: $data['orgId'] ?? '',
            name: $data['name'] ?? '',
            categoryType: $data['categoryType'] ?? '',
            isDefault: (bool) ($data['isDefault'] ?? false),
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            usage: $data['usage'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'id' => $this->id,
            'orgId' => $this->orgId,
            'name' => $this->name,
            'categoryType' => $this->categoryType,
            'isDefault' => $this->isDefault,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->usage !== null) {
            $data['usage'] = $this->usage;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
