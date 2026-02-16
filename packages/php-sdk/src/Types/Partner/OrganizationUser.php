<?php

declare(strict_types=1);

namespace TurboDocx\Types\Partner;

/**
 * Organization user domain type
 */
final class OrganizationUser implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $email,
        public readonly ?string $firstName = null,
        public readonly ?string $lastName = null,
        public readonly ?string $ssoId = null,
        public readonly ?string $role = null,
        public readonly ?string $createdOn = null,
        public readonly ?bool $isActive = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? $data['userId'] ?? '',
            email: $data['email'] ?? '',
            firstName: $data['firstName'] ?? null,
            lastName: $data['lastName'] ?? null,
            ssoId: $data['ssoId'] ?? null,
            role: $data['role'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            isActive: isset($data['isActive']) ? (bool) $data['isActive'] : null,
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
            'email' => $this->email,
            'firstName' => $this->firstName,
            'lastName' => $this->lastName,
            'ssoId' => $this->ssoId,
            'role' => $this->role,
            'createdOn' => $this->createdOn,
            'isActive' => $this->isActive,
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
