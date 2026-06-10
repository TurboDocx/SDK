<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a bundle
 */
final class UpdateBundleRequest
{
    /**
     * @param array<array<string, mixed>>|null $items
     */
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?array $items = null,
        public readonly ?string $description = null,
        public readonly ?string $sku = null,
        public readonly ?string $categoryId = null,
        public readonly ?float $bundleDiscountPercent = null,
        public readonly ?string $bundleDiscountType = null,
        public readonly ?float $bundleDiscountAmount = null,
        public readonly ?string $currency = null,
        public readonly ?bool $showItemsToEndUser = null,
        public readonly ?bool $showInCatalog = null,
        public readonly ?bool $syncWithProducts = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->name !== null) {
            $data['name'] = $this->name;
        }
        if ($this->items !== null) {
            $data['items'] = $this->items;
        }
        if ($this->description !== null) {
            $data['description'] = $this->description;
        }
        if ($this->sku !== null) {
            $data['sku'] = $this->sku;
        }
        if ($this->categoryId !== null) {
            $data['categoryId'] = $this->categoryId;
        }
        if ($this->bundleDiscountPercent !== null) {
            $data['bundleDiscountPercent'] = $this->bundleDiscountPercent;
        }
        if ($this->bundleDiscountType !== null) {
            $data['bundleDiscountType'] = $this->bundleDiscountType;
        }
        if ($this->bundleDiscountAmount !== null) {
            $data['bundleDiscountAmount'] = $this->bundleDiscountAmount;
        }
        if ($this->currency !== null) {
            $data['currency'] = $this->currency;
        }
        if ($this->showItemsToEndUser !== null) {
            $data['showItemsToEndUser'] = $this->showItemsToEndUser;
        }
        if ($this->showInCatalog !== null) {
            $data['showInCatalog'] = $this->showInCatalog;
        }
        if ($this->syncWithProducts !== null) {
            $data['syncWithProducts'] = $this->syncWithProducts;
        }

        return $data;
    }
}
