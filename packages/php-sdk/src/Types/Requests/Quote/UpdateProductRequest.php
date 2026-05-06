<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a product.
 *
 * Only fields that are explicitly passed to the constructor are included in the
 * serialised payload.  Nullable fields (sku, description, detailedSpecification,
 * internalNotes, cost) can be set to `null` to clear them on the server — they
 * are tracked separately so we can distinguish "not provided" from "set to null".
 */
final class UpdateProductRequest
{
    /** @var array<string, true> fields that were explicitly provided */
    private array $provided = [];

    private ?string $sku;
    private ?string $description;
    private ?string $detailedSpecification;
    private ?string $internalNotes;
    private ?float $cost;

    /**
     * @param string[] $images File paths or raw bytes for product images
     * @param string[]|null $imageIdsToKeep
     * @param string[]|null $imageOrder
     */
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?float $listPrice = null,
        public readonly ?string $billingFrequency = null,
        ?string $sku = null,
        ?string $description = null,
        ?string $detailedSpecification = null,
        ?string $internalNotes = null,
        public readonly ?string $categoryId = null,
        ?float $cost = null,
        public readonly ?int $minimumOrderQuantity = null,
        public readonly ?string $currency = null,
        public readonly ?bool $showInCatalog = null,
        public readonly array $images = [],
        public readonly ?array $imageIdsToKeep = null,
        public readonly ?array $imageOrder = null,
        bool $includeSku = false,
        bool $includeDescription = false,
        bool $includeDetailedSpecification = false,
        bool $includeInternalNotes = false,
        bool $includeCost = false,
    ) {
        $this->sku = $sku;
        $this->description = $description;
        $this->detailedSpecification = $detailedSpecification;
        $this->internalNotes = $internalNotes;
        $this->cost = $cost;

        // Track which nullable fields were explicitly provided.
        // A non-null value always counts as "provided".
        // To explicitly set to null, pass includeXxx: true.
        if ($sku !== null || $includeSku) {
            $this->provided['sku'] = true;
        }
        if ($description !== null || $includeDescription) {
            $this->provided['description'] = true;
        }
        if ($detailedSpecification !== null || $includeDetailedSpecification) {
            $this->provided['detailedSpecification'] = true;
        }
        if ($internalNotes !== null || $includeInternalNotes) {
            $this->provided['internalNotes'] = true;
        }
        if ($cost !== null || $includeCost) {
            $this->provided['cost'] = true;
        }
    }

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
        if (isset($this->provided['sku'])) {
            $data['sku'] = $this->sku;
        }
        if (isset($this->provided['description'])) {
            $data['description'] = $this->description;
        }
        if (isset($this->provided['detailedSpecification'])) {
            $data['detailedSpecification'] = $this->detailedSpecification;
        }
        if (isset($this->provided['internalNotes'])) {
            $data['internalNotes'] = $this->internalNotes;
        }
        if ($this->categoryId !== null) {
            $data['categoryId'] = $this->categoryId;
        }
        if (isset($this->provided['cost'])) {
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
