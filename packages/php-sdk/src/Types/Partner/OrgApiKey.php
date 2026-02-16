<?php

declare(strict_types=1);

namespace TurboDocx\Types\Partner;

/**
 * Organization API key domain type
 */
final class OrgApiKey implements \JsonSerializable
{
    /**
     * @param string $id
     * @param string $name
     * @param string|null $key Masked preview when listing; full plaintext key only returned once on creation
     * @param string|null $role
     * @param array<string>|null $scopes
     * @param string|null $createdOn
     * @param string|null $createdBy
     * @param string|null $lastUsedOn
     * @param string|null $lastUsedIP
     * @param string|null $updatedOn
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly ?string $key = null,
        public readonly ?string $role = null,
        public readonly ?array $scopes = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $createdBy = null,
        public readonly ?string $lastUsedOn = null,
        public readonly ?string $lastUsedIP = null,
        public readonly ?string $updatedOn = null,
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
            key: $data['key'] ?? null,
            role: $data['role'] ?? null,
            scopes: $data['scopes'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            createdBy: $data['createdBy'] ?? null,
            lastUsedOn: $data['lastUsedOn'] ?? null,
            lastUsedIP: $data['lastUsedIP'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
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
            'key' => $this->key,
            'role' => $this->role,
            'scopes' => $this->scopes,
            'createdOn' => $this->createdOn,
            'createdBy' => $this->createdBy,
            'lastUsedOn' => $this->lastUsedOn,
            'lastUsedIP' => $this->lastUsedIP,
            'updatedOn' => $this->updatedOn,
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
