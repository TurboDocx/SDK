<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Bundle item domain type
 */
final class BundleItem implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $bundleId,
        public readonly string $productId,
        public readonly float $quantity = 1,
        public readonly float $unitPrice = 0,
        public readonly float $discountPercent = 0,
        public readonly float $finalPrice = 0,
        public readonly ?float $cost = null,
        public readonly string $billingFrequency = 'monthly',
        public readonly string $itemStatus = 'active',
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?Product $product = null,
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
            bundleId: $data['bundleId'] ?? '',
            productId: $data['productId'] ?? '',
            quantity: (float) ($data['quantity'] ?? 1),
            unitPrice: (float) ($data['unitPrice'] ?? 0),
            discountPercent: (float) ($data['discountPercent'] ?? 0),
            finalPrice: (float) ($data['finalPrice'] ?? 0),
            cost: isset($data['cost']) ? (float) $data['cost'] : null,
            billingFrequency: $data['billingFrequency'] ?? 'monthly',
            itemStatus: $data['itemStatus'] ?? 'active',
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            product: isset($data['product']) ? Product::fromArray($data['product']) : null,
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
            'bundleId' => $this->bundleId,
            'productId' => $this->productId,
            'quantity' => $this->quantity,
            'unitPrice' => $this->unitPrice,
            'discountPercent' => $this->discountPercent,
            'finalPrice' => $this->finalPrice,
            'cost' => $this->cost,
            'billingFrequency' => $this->billingFrequency,
            'itemStatus' => $this->itemStatus,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->product !== null) {
            $data['product'] = $this->product->toArray();
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
