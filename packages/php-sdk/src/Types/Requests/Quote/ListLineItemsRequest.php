<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing line items with optional filters
 */
final class ListLineItemsRequest
{
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $lineItemType = null,
        public readonly ?string $billingFrequency = null,
        public readonly ?string $parentLineItemId = null,
    ) {}

    /**
     * @return array<string, string>
     */
    public function toQueryParams(): array
    {
        $params = [];

        if ($this->limit !== null) {
            $params['limit'] = (string) $this->limit;
        }
        if ($this->offset !== null) {
            $params['offset'] = (string) $this->offset;
        }
        if ($this->lineItemType !== null) {
            $params['lineItemType'] = $this->lineItemType;
        }
        if ($this->billingFrequency !== null) {
            $params['billingFrequency'] = $this->billingFrequency;
        }
        if ($this->parentLineItemId !== null) {
            $params['parentLineItemId'] = $this->parentLineItemId;
        }

        return $params;
    }
}
