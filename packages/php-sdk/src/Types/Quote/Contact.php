<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Contact domain type
 */
final class Contact implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $companyId,
        public readonly string $name,
        public readonly ?string $email = null,
        public readonly ?string $phone = null,
        public readonly ?string $title = null,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?Company $company = null,
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
            companyId: $data['companyId'] ?? '',
            name: $data['name'] ?? '',
            email: $data['email'] ?? null,
            phone: $data['phone'] ?? null,
            title: $data['title'] ?? null,
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            company: isset($data['company']) ? Company::fromArray($data['company']) : null,
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
            'companyId' => $this->companyId,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'title' => $this->title,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->company !== null) {
            $data['company'] = $this->company->toArray();
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
