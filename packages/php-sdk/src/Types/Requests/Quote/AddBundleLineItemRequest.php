<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for adding a bundle line item to a quote
 */
final class AddBundleLineItemRequest
{
    public function __construct(
        public readonly string $bundleId,
        public readonly string $bundleName,
        public readonly ?int $quantity = null,
        public readonly ?float $discountPercent = null,
        public readonly ?string $discountType = null,
        public readonly ?float $discountAmount = null,
        public readonly ?string $bundleDescription = null,
        public readonly ?bool $showItemsToEndUser = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'bundleId' => $this->bundleId,
            'bundleName' => $this->bundleName,
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
        if ($this->bundleDescription !== null) {
            $data['bundleDescription'] = $this->bundleDescription;
        }
        if ($this->showItemsToEndUser !== null) {
            $data['showItemsToEndUser'] = $this->showItemsToEndUser;
        }

        return $data;
    }
}
