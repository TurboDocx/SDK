<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing companies with optional filters
 */
final class ListCompaniesRequest
{
    /**
     * @param string|string[]|null $industryIds
     */
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
        public readonly string|array|null $industryIds = null,
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
        if ($this->industryIds !== null) {
            if (is_array($this->industryIds)) {
                $params['industryIds'] = $this->industryIds;
            } else {
                $params['industryIds'] = $this->industryIds;
            }
        }

        return $params;
    }
}
