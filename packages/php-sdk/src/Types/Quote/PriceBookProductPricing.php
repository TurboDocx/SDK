<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Price book product pricing domain type
 */
final class PriceBookProductPricing implements \JsonSerializable
{
    public function __construct(
        public readonly ?string $id = null,
        public readonly ?string $priceBookId = null,
        public readonly string $productId = '',
        public readonly float $discountPercent = 0,
        public readonly float $finalPrice = 0,
        public readonly ?string $orgId = null,
        public readonly ?bool $isActive = null,
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
            id: $data['id'] ?? null,
            priceBookId: $data['priceBookId'] ?? null,
            productId: $data['productId'] ?? '',
            discountPercent: (float) ($data['discountPercent'] ?? 0),
            finalPrice: (float) ($data['finalPrice'] ?? 0),
            orgId: $data['orgId'] ?? null,
            isActive: isset($data['isActive']) ? (bool) $data['isActive'] : null,
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
            'productId' => $this->productId,
            'discountPercent' => $this->discountPercent,
            'finalPrice' => $this->finalPrice,
        ];

        if ($this->id !== null) {
            $data['id'] = $this->id;
        }
        if ($this->priceBookId !== null) {
            $data['priceBookId'] = $this->priceBookId;
        }
        if ($this->orgId !== null) {
            $data['orgId'] = $this->orgId;
        }
        if ($this->isActive !== null) {
            $data['isActive'] = $this->isActive;
        }
        if ($this->createdBy !== null) {
            $data['createdBy'] = $this->createdBy;
        }
        if ($this->createdOn !== null) {
            $data['createdOn'] = $this->createdOn;
        }
        if ($this->updatedOn !== null) {
            $data['updatedOn'] = $this->updatedOn;
        }
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
