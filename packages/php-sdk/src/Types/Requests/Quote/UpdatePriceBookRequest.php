<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a price book
 *
 * `validTo` supports null-clear semantics: pass `null` + `includeValidTo: true`
 * to explicitly clear the field on the server. Omitting `validTo` (or not setting
 * `includeValidTo`) leaves the server value unchanged.
 */
final class UpdatePriceBookRequest
{
    /**
     * @param array<array<string, mixed>>|null $productPricing
     */
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $priceBookTypeId = null,
        public readonly ?string $description = null,
        public readonly ?float $discountPercent = null,
        public readonly ?string $validFrom = null,
        // validTo is nullable/null-clearable — use includeValidTo: true to
        // explicitly send null (clears the value on the server).
        public readonly ?string $validTo = null,
        public readonly ?bool $isDefault = null,
        public readonly ?bool $showInQuoteBuilder = null,
        public readonly ?array $productPricing = null,
        public readonly bool $includeValidTo = false,
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
        if ($this->priceBookTypeId !== null) {
            $data['priceBookTypeId'] = $this->priceBookTypeId;
        }
        if ($this->description !== null) {
            $data['description'] = $this->description;
        }
        if ($this->discountPercent !== null) {
            $data['discountPercent'] = $this->discountPercent;
        }
        if ($this->validFrom !== null) {
            $data['validFrom'] = $this->validFrom;
        }
        if ($this->includeValidTo) {
            $data['validTo'] = $this->validTo;
        } elseif ($this->validTo !== null) {
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
