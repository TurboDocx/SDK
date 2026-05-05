<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a product
 */
final class UpdateProductRequest
{
    /**
     * @param string[] $images File paths or raw bytes for product images
     * @param string[]|null $imageIdsToKeep
     * @param string[]|null $imageOrder
     */
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?float $listPrice = null,
        public readonly ?string $billingFrequency = null,
        public readonly ?string $sku = null,
        public readonly ?string $description = null,
        public readonly ?string $detailedSpecification = null,
        public readonly ?string $internalNotes = null,
        public readonly ?string $categoryId = null,
        public readonly ?float $cost = null,
        public readonly ?int $minimumOrderQuantity = null,
        public readonly ?string $currency = null,
        public readonly ?bool $showInCatalog = null,
        public readonly array $images = [],
        public readonly ?array $imageIdsToKeep = null,
        public readonly ?array $imageOrder = null,
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
        if ($this->listPrice !== null) {
            $data['listPrice'] = $this->listPrice;
        }
        if ($this->billingFrequency !== null) {
            $data['billingFrequency'] = $this->billingFrequency;
        }
        if ($this->sku !== null) {
            $data['sku'] = $this->sku;
        }
        if ($this->description !== null) {
            $data['description'] = $this->description;
        }
        if ($this->detailedSpecification !== null) {
            $data['detailedSpecification'] = $this->detailedSpecification;
        }
        if ($this->internalNotes !== null) {
            $data['internalNotes'] = $this->internalNotes;
        }
        if ($this->categoryId !== null) {
            $data['categoryId'] = $this->categoryId;
        }
        if ($this->cost !== null) {
            $data['cost'] = $this->cost;
        }
        if ($this->minimumOrderQuantity !== null) {
            $data['minimumOrderQuantity'] = $this->minimumOrderQuantity;
        }
        if ($this->currency !== null) {
            $data['currency'] = $this->currency;
        }
        if ($this->showInCatalog !== null) {
            $data['showInCatalog'] = $this->showInCatalog;
        }
        if (count($this->images) > 0) {
            $data['images'] = $this->images;
        }
        if ($this->imageIdsToKeep !== null) {
            $data['imageIdsToKeep'] = $this->imageIdsToKeep;
        }
        if ($this->imageOrder !== null) {
            $data['imageOrder'] = $this->imageOrder;
        }

        return $data;
    }
}
