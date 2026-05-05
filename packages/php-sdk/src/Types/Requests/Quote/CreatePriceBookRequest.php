<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for creating a price book
 */
final class CreatePriceBookRequest
{
    /**
     * @param array<array<string, mixed>>|null $productPricing
     */
    public function __construct(
        public readonly string $name,
        public readonly string $priceBookTypeId,
        public readonly string $validFrom,
        public readonly ?float $discountPercent = null,
        public readonly ?string $description = null,
        public readonly ?string $validTo = null,
        public readonly ?bool $isDefault = null,
        public readonly ?bool $showInQuoteBuilder = null,
        public readonly ?array $productPricing = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'priceBookTypeId' => $this->priceBookTypeId,
            'validFrom' => $this->validFrom,
        ];

        if ($this->discountPercent !== null) {
            $data['discountPercent'] = $this->discountPercent;
        }
        if ($this->description !== null) {
            $data['description'] = $this->description;
        }
        if ($this->validTo !== null) {
            $data['validTo'] = $this->validTo;
        }
        if ($this->isDefault !== null) {
            $data['isDefault'] = $this->isDefault;
        }
        if ($this->showInQuoteBuilder !== null) {
            $data['showInQuoteBuilder'] = $this->showInQuoteBuilder;
        }
        if ($this->productPricing !== null) {
            $data['productPricing'] = $this->productPricing;
        }

        return $data;
    }
}
