<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for creating a product
 */
final class CreateProductRequest
{
    /**
     * @param string[] $images File paths or raw bytes for product images
     */
    public function __construct(
        public readonly string $name,
        public readonly float $listPrice,
        public readonly string $billingFrequency,
        public readonly string $categoryId,
        public readonly ?string $sku = null,
        public readonly ?string $description = null,
        public readonly ?string $detailedSpecification = null,
        public readonly ?string $internalNotes = null,
        public readonly ?float $cost = null,
        public readonly ?int $minimumOrderQuantity = null,
        public readonly ?string $currency = null,
        public readonly ?bool $showInCatalog = null,
        public readonly array $images = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'listPrice' => $this->listPrice,
            'billingFrequency' => $this->billingFrequency,
            'categoryId' => $this->categoryId,
        ];

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

        return $data;
    }
}
