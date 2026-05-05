<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for creating a quote, adding items, and sending in one call
 */
final class CreateAndSendRequest
{
    /**
     * @param array<AddLineItemRequest>|null $items
     * @param array<AddBundleLineItemRequest>|null $bundleItems
     */
    public function __construct(
        public readonly string $name,
        public readonly string $companyId,
        public readonly string $contactId,
        public readonly ?string $currency = null,
        public readonly ?int $termDays = null,
        public readonly ?string $renewalPeriod = null,
        public readonly ?string $validUntil = null,
        public readonly ?float $taxRate = null,
        public readonly ?string $priceBookId = null,
        public readonly ?array $items = null,
        public readonly ?array $bundleItems = null,
        public readonly ?SendQuoteRequest $send = null,
    ) {}

    /**
     * Get the quote creation fields as an array (without items/bundleItems/send).
     *
     * @return array<string, mixed>
     */
    public function toQuoteArray(): array
    {
        $data = [
            'name' => $this->name,
            'companyId' => $this->companyId,
            'contactId' => $this->contactId,
        ];

        if ($this->currency !== null) {
            $data['currency'] = $this->currency;
        }
        if ($this->termDays !== null) {
            $data['termDays'] = $this->termDays;
        }
        if ($this->renewalPeriod !== null) {
            $data['renewalPeriod'] = $this->renewalPeriod;
        }
        if ($this->validUntil !== null) {
            $data['validUntil'] = $this->validUntil;
        }
        if ($this->taxRate !== null) {
            $data['taxRate'] = $this->taxRate;
        }
        if ($this->priceBookId !== null) {
            $data['priceBookId'] = $this->priceBookId;
        }

        return $data;
    }

    /**
     * Get items as arrays for the API.
     *
     * @return array<array<string, mixed>>|null
     */
    public function getItemsArray(): ?array
    {
        if ($this->items === null) {
            return null;
        }

        return array_map(fn(AddLineItemRequest $item) => $item->toArray(), $this->items);
    }

    /**
     * Get bundle items as arrays for the API.
     *
     * @return array<array<string, mixed>>|null
     */
    public function getBundleItemsArray(): ?array
    {
        if ($this->bundleItems === null) {
            return null;
        }

        return array_map(fn(AddBundleLineItemRequest $item) => $item->toArray(), $this->bundleItems);
    }
}
