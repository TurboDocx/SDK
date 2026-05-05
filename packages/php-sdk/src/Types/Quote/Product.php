<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Product domain type
 */
final class Product implements \JsonSerializable
{
    /**
     * @param array<ProductImage>|null $images
     * @param array{id: string, name: string, categoryType: string}|null $category
     */
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $name,
        public readonly ?string $sku = null,
        public readonly ?string $description = null,
        public readonly ?string $detailedSpecification = null,
        public readonly ?string $internalNotes = null,
        public readonly string $categoryId = '',
        public readonly float $listPrice = 0,
        public readonly ?float $cost = null,
        public readonly int $minimumOrderQuantity = 1,
        public readonly string $billingFrequency = 'monthly',
        public readonly string $currency = 'USD',
        public readonly bool $showInCatalog = true,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?array $images = null,
        public readonly ?array $category = null,
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
            sku: $data['sku'] ?? null,
            description: $data['description'] ?? null,
            detailedSpecification: $data['detailedSpecification'] ?? null,
            internalNotes: $data['internalNotes'] ?? null,
            categoryId: $data['categoryId'] ?? '',
            listPrice: (float) ($data['listPrice'] ?? 0),
            cost: isset($data['cost']) ? (float) $data['cost'] : null,
            minimumOrderQuantity: (int) ($data['minimumOrderQuantity'] ?? 1),
            billingFrequency: $data['billingFrequency'] ?? 'monthly',
            currency: $data['currency'] ?? 'USD',
            showInCatalog: (bool) ($data['showInCatalog'] ?? true),
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            images: isset($data['images']) ? array_map(
                fn(array $img) => ProductImage::fromArray($img),
                $data['images']
            ) : null,
            category: $data['category'] ?? null,
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
            'sku' => $this->sku,
            'description' => $this->description,
            'detailedSpecification' => $this->detailedSpecification,
            'internalNotes' => $this->internalNotes,
            'categoryId' => $this->categoryId,
            'listPrice' => $this->listPrice,
            'cost' => $this->cost,
            'minimumOrderQuantity' => $this->minimumOrderQuantity,
            'billingFrequency' => $this->billingFrequency,
            'currency' => $this->currency,
            'showInCatalog' => $this->showInCatalog,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->images !== null) {
            $data['images'] = array_map(fn(ProductImage $img) => $img->toArray(), $this->images);
        }
        if ($this->category !== null) {
            $data['category'] = $this->category;
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
