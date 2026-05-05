<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing products with optional filters
 */
final class ListProductsRequest
{
    /**
     * @param string[]|null $categoryIds
     */
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
        public readonly ?array $categoryIds = null,
        public readonly ?string $billingFrequency = null,
        public readonly ?string $currency = null,
        public readonly ?bool $showInCatalog = null,
    ) {}

    /**
     * @return array<string, string|string[]>
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
        if ($this->query !== null) {
            $params['query'] = $this->query;
        }
        if ($this->categoryIds !== null) {
            $params['categoryIds'] = $this->categoryIds;
        }
        if ($this->billingFrequency !== null) {
            $params['billingFrequency'] = $this->billingFrequency;
        }
        if ($this->currency !== null) {
            $params['currency'] = $this->currency;
        }
        if ($this->showInCatalog !== null) {
            $params['showInCatalog'] = $this->showInCatalog ? 'true' : 'false';
        }

        return $params;
    }
}
