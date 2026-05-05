<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing products in a price book
 */
final class ListPriceBookProductsRequest
{
    /**
     * @param string|string[]|null $categoryIds
     */
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
        public readonly string|array|null $categoryIds = null,
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
            if (is_array($this->categoryIds)) {
                $params['categoryIds'] = $this->categoryIds;
            } else {
                $params['categoryIds'] = $this->categoryIds;
            }
        }

        return $params;
    }
}
