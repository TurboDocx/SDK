<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Price book domain type
 */
final class PriceBook implements \JsonSerializable
{
    /**
     * @param array<PriceBookProductPricing>|null $productPricing
     * @param array{id: string, name: string, categoryType: string}|null $priceBookType
     */
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $name,
        public readonly ?string $description = null,
        public readonly string $priceBookTypeId = '',
        public readonly float $discountPercent = 0,
        public readonly string $validFrom = '',
        public readonly ?string $validTo = null,
        public readonly bool $isDefault = false,
        public readonly bool $showInQuoteBuilder = true,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?array $productPricing = null,
        public readonly ?array $priceBookType = null,
        public readonly ?int $productCount = null,
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
            description: $data['description'] ?? null,
            priceBookTypeId: $data['priceBookTypeId'] ?? '',
            discountPercent: (float) ($data['discountPercent'] ?? 0),
            validFrom: $data['validFrom'] ?? '',
            validTo: $data['validTo'] ?? null,
            isDefault: (bool) ($data['isDefault'] ?? false),
            showInQuoteBuilder: (bool) ($data['showInQuoteBuilder'] ?? true),
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            productPricing: isset($data['productPricing']) ? array_map(
                fn(array $pp) => PriceBookProductPricing::fromArray($pp),
                $data['productPricing']
            ) : null,
            priceBookType: $data['priceBookType'] ?? null,
            productCount: isset($data['productCount']) ? (int) $data['productCount'] : null,
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
            'description' => $this->description,
            'priceBookTypeId' => $this->priceBookTypeId,
            'discountPercent' => $this->discountPercent,
            'validFrom' => $this->validFrom,
            'validTo' => $this->validTo,
            'isDefault' => $this->isDefault,
            'showInQuoteBuilder' => $this->showInQuoteBuilder,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->productPricing !== null) {
            $data['productPricing'] = array_map(fn(PriceBookProductPricing $pp) => $pp->toArray(), $this->productPricing);
        }
        if ($this->priceBookType !== null) {
            $data['priceBookType'] = $this->priceBookType;
        }
        if ($this->productCount !== null) {
            $data['productCount'] = $this->productCount;
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
