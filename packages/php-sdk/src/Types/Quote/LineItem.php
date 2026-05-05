<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Line item domain type
 */
final class LineItem implements \JsonSerializable
{
    /**
     * @param array<LineItem>|null $childLineItems
     */
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $quoteId,
        public readonly string $lineItemType,
        public readonly ?string $parentLineItemId = null,
        public readonly ?string $productId = null,
        public readonly ?string $productName = null,
        public readonly ?string $productSku = null,
        public readonly ?string $productDescription = null,
        public readonly ?string $bundleId = null,
        public readonly ?string $bundleName = null,
        public readonly ?string $bundleDescription = null,
        public readonly float $quantity = 1,
        public readonly float $unitPrice = 0,
        public readonly float $discountPercent = 0,
        public readonly float $subtotal = 0,
        public readonly ?float $cost = null,
        public readonly ?float $marginPercent = null,
        public readonly ?string $categoryId = null,
        public readonly ?string $categoryName = null,
        public readonly ?string $billingFrequency = null,
        public readonly bool $showItemsToEndUser = false,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?Product $product = null,
        public readonly ?array $childLineItems = null,
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
            quoteId: $data['quoteId'] ?? '',
            lineItemType: $data['lineItemType'] ?? 'product',
            parentLineItemId: $data['parentLineItemId'] ?? null,
            productId: $data['productId'] ?? null,
            productName: $data['productName'] ?? null,
            productSku: $data['productSku'] ?? null,
            productDescription: $data['productDescription'] ?? null,
            bundleId: $data['bundleId'] ?? null,
            bundleName: $data['bundleName'] ?? null,
            bundleDescription: $data['bundleDescription'] ?? null,
            quantity: (float) ($data['quantity'] ?? 1),
            unitPrice: (float) ($data['unitPrice'] ?? 0),
            discountPercent: (float) ($data['discountPercent'] ?? 0),
            subtotal: (float) ($data['subtotal'] ?? 0),
            cost: isset($data['cost']) ? (float) $data['cost'] : null,
            marginPercent: isset($data['marginPercent']) ? (float) $data['marginPercent'] : null,
            categoryId: $data['categoryId'] ?? null,
            categoryName: $data['categoryName'] ?? null,
            billingFrequency: $data['billingFrequency'] ?? null,
            showItemsToEndUser: (bool) ($data['showItemsToEndUser'] ?? false),
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            product: isset($data['product']) ? Product::fromArray($data['product']) : null,
            childLineItems: isset($data['childLineItems']) ? array_map(
                fn(array $item) => self::fromArray($item),
                $data['childLineItems']
            ) : null,
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
            'quoteId' => $this->quoteId,
            'lineItemType' => $this->lineItemType,
            'parentLineItemId' => $this->parentLineItemId,
            'productId' => $this->productId,
            'productName' => $this->productName,
            'productSku' => $this->productSku,
            'productDescription' => $this->productDescription,
            'bundleId' => $this->bundleId,
            'bundleName' => $this->bundleName,
            'bundleDescription' => $this->bundleDescription,
            'quantity' => $this->quantity,
            'unitPrice' => $this->unitPrice,
            'discountPercent' => $this->discountPercent,
            'subtotal' => $this->subtotal,
            'cost' => $this->cost,
            'marginPercent' => $this->marginPercent,
            'categoryId' => $this->categoryId,
            'categoryName' => $this->categoryName,
            'billingFrequency' => $this->billingFrequency,
            'showItemsToEndUser' => $this->showItemsToEndUser,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->product !== null) {
            $data['product'] = $this->product->toArray();
        }
        if ($this->childLineItems !== null) {
            $data['childLineItems'] = array_map(fn(LineItem $item) => $item->toArray(), $this->childLineItems);
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
