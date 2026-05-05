<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Bundle domain type
 */
final class Bundle implements \JsonSerializable
{
    /**
     * @param array<BundleItem>|null $items
     * @param array{id: string, name: string, categoryType: string}|null $category
     */
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $name,
        public readonly ?string $description = null,
        public readonly ?string $sku = null,
        public readonly ?string $categoryId = null,
        public readonly float $bundleDiscountPercent = 0,
        public readonly float $totalListPrice = 0,
        public readonly float $totalFinalPrice = 0,
        public readonly float $totalCost = 0,
        public readonly string $currency = 'USD',
        public readonly bool $showItemsToEndUser = false,
        public readonly bool $showInCatalog = true,
        public readonly bool $syncWithProducts = false,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?array $items = null,
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
            description: $data['description'] ?? null,
            sku: $data['sku'] ?? null,
            categoryId: $data['categoryId'] ?? null,
            bundleDiscountPercent: (float) ($data['bundleDiscountPercent'] ?? 0),
            totalListPrice: (float) ($data['totalListPrice'] ?? 0),
            totalFinalPrice: (float) ($data['totalFinalPrice'] ?? 0),
            totalCost: (float) ($data['totalCost'] ?? 0),
            currency: $data['currency'] ?? 'USD',
            showItemsToEndUser: (bool) ($data['showItemsToEndUser'] ?? false),
            showInCatalog: (bool) ($data['showInCatalog'] ?? true),
            syncWithProducts: (bool) ($data['syncWithProducts'] ?? false),
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            items: isset($data['items']) ? array_map(
                fn(array $item) => BundleItem::fromArray($item),
                $data['items']
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
            'description' => $this->description,
            'sku' => $this->sku,
            'categoryId' => $this->categoryId,
            'bundleDiscountPercent' => $this->bundleDiscountPercent,
            'totalListPrice' => $this->totalListPrice,
            'totalFinalPrice' => $this->totalFinalPrice,
            'totalCost' => $this->totalCost,
            'currency' => $this->currency,
            'showItemsToEndUser' => $this->showItemsToEndUser,
            'showInCatalog' => $this->showInCatalog,
            'syncWithProducts' => $this->syncWithProducts,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->items !== null) {
            $data['items'] = array_map(fn(BundleItem $item) => $item->toArray(), $this->items);
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
