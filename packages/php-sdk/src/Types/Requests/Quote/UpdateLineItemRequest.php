<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a line item
 */
final class UpdateLineItemRequest
{
    public function __construct(
        public readonly ?int $quantity = null,
        public readonly ?float $unitPrice = null,
        public readonly ?float $discountPercent = null,
        public readonly ?string $billingFrequency = null,
        public readonly ?string $categoryId = null,
        public readonly ?string $categoryName = null,
        public readonly ?float $cost = null,
        public readonly ?bool $showItemsToEndUser = null,
        public readonly ?string $productName = null,
        public readonly ?string $productSku = null,
        public readonly ?string $productDescription = null,
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
        if ($this->billingFrequency !== null) {
            $data['billingFrequency'] = $this->billingFrequency;
        }
        if ($this->categoryId !== null) {
            $data['categoryId'] = $this->categoryId;
        }
        if ($this->categoryName !== null) {
            $data['categoryName'] = $this->categoryName;
        }
        if ($this->cost !== null) {
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

        return $data;
    }
}
