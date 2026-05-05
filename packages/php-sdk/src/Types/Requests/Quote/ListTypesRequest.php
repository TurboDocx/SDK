<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing types/categories
 */
final class ListTypesRequest
{
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
        public readonly ?string $categoryType = null,
        public readonly ?bool $includeUsage = null,
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
        if ($this->query !== null) {
            $params['query'] = $this->query;
        }
        if ($this->categoryType !== null) {
            $params['categoryType'] = $this->categoryType;
        }
        if ($this->includeUsage !== null) {
            $params['includeUsage'] = $this->includeUsage ? 'true' : 'false';
        }

        return $params;
    }
}
