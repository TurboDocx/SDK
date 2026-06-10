<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for adding a line item to a quote
 */
final class AddLineItemRequest
{
    public function __construct(
        public readonly ?string $productId,
        public readonly string $productName,
        public readonly float $unitPrice,
        public readonly string $billingFrequency,
        public readonly ?int $quantity = null,
        public readonly ?float $discountPercent = null,
        public readonly ?string $discountType = null,
        public readonly ?float $discountAmount = null,
        public readonly ?string $categoryId = null,
        public readonly ?string $categoryName = null,
        public readonly ?float $cost = null,
        public readonly ?string $productSku = null,
        public readonly ?string $productDescription = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'productId' => $this->productId,
            'productName' => $this->productName,
            'unitPrice' => $this->unitPrice,
            'billingFrequency' => $this->billingFrequency,
        ];

        if ($this->quantity !== null) {
            $data['quantity'] = $this->quantity;
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
        if ($this->categoryId !== null) {
            $data['categoryId'] = $this->categoryId;
        }
        if ($this->categoryName !== null) {
            $data['categoryName'] = $this->categoryName;
        }
        if ($this->cost !== null) {
            $data['cost'] = $this->cost;
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
