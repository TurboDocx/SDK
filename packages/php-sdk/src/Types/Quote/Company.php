<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Company domain type
 */
final class Company implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $name,
        public readonly ?string $phone = null,
        public readonly ?string $city = null,
        public readonly ?string $state = null,
        public readonly ?string $country = null,
        public readonly ?string $industryId = null,
        public readonly ?string $lastActivityDate = null,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?int $contactCount = null,
        public readonly ?QuoteType $industry = null,
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
            phone: $data['phone'] ?? null,
            city: $data['city'] ?? null,
            state: $data['state'] ?? null,
            country: $data['country'] ?? null,
            industryId: $data['industryId'] ?? null,
            lastActivityDate: $data['lastActivityDate'] ?? null,
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            contactCount: isset($data['contactCount']) ? (int) $data['contactCount'] : null,
            industry: isset($data['industry']) ? QuoteType::fromArray($data['industry']) : null,
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
            'phone' => $this->phone,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'industryId' => $this->industryId,
            'lastActivityDate' => $this->lastActivityDate,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->contactCount !== null) {
            $data['contactCount'] = $this->contactCount;
        }
        if ($this->industry !== null) {
            $data['industry'] = $this->industry->toArray();
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
