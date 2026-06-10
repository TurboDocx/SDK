<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a line item
 *
 * Several fields support null-clear semantics: pass `null` + the matching
 * `include<Field>: true` flag to explicitly clear the field on the server.
 * Omitting the field (or leaving the flag `false`) leaves the server value unchanged.
 *
 * Null-clearable fields: `categoryId`, `cost`, `displayOrder`
 */
final class UpdateLineItemRequest
{
    public function __construct(
        public readonly ?int $quantity = null,
        public readonly ?float $unitPrice = null,
        public readonly ?float $discountPercent = null,
        public readonly ?string $discountType = null,
        public readonly ?float $discountAmount = null,
        public readonly ?string $billingFrequency = null,
        // categoryId is nullable/null-clearable — use includeCategoryId: true to
        // explicitly send null (clears the value on the server).
        public readonly ?string $categoryId = null,
        public readonly ?string $categoryName = null,
        // cost is nullable/null-clearable — use includeCost: true to
        // explicitly send null (clears the value on the server).
        public readonly ?float $cost = null,
        public readonly ?bool $showItemsToEndUser = null,
        public readonly ?string $productName = null,
        public readonly ?string $productSku = null,
        public readonly ?string $productDescription = null,
        // displayOrder is nullable/null-clearable — use includeDisplayOrder: true to
        // explicitly send null (clears the value on the server).
        public readonly ?int $displayOrder = null,
        public readonly bool $includeDisplayOrder = false,
        public readonly bool $includeCategoryId = false,
        public readonly bool $includeCost = false,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->quantity !== null) {
            $data['quantity'] = $this->quantity;
        }
        if ($this->unitPrice !== null) {
            $data['unitPrice'] = $this->unitPrice;
        }
        if ($this->discountPercent !== null) {
            $data['discountPercent'] = $this->discountPercent;
        }
        if ($this->discountType !== null) {
            $data['discountType'] = $this->discountType;
        }
        if ($this->discountAmount !== null) {
            $data['discountAmount'] = $this->discountAmount;
        }
        if ($this->billingFrequency !== null) {
            $data['billingFrequency'] = $this->billingFrequency;
        }
        if ($this->includeCategoryId) {
            $data['categoryId'] = $this->categoryId;
        } elseif ($this->categoryId !== null) {
            $data['categoryId'] = $this->categoryId;
        }
        if ($this->categoryName !== null) {
            $data['categoryName'] = $this->categoryName;
        }
        if ($this->includeCost) {
            $data['cost'] = $this->cost;
        } elseif ($this->cost !== null) {
            $data['cost'] = $this->cost;
        }
        if ($this->showItemsToEndUser !== null) {
            $data['showItemsToEndUser'] = $this->showItemsToEndUser;
        }
        if ($this->productName !== null) {
            $data['productName'] = $this->productName;
        }
        if ($this->productSku !== null) {
            $data['productSku'] = $this->productSku;
        }
        if ($this->productDescription !== null) {
            $data['productDescription'] = $this->productDescription;
        }
        if ($this->includeDisplayOrder) {
            $data['displayOrder'] = $this->displayOrder;
        }

        return $data;
    }
}
