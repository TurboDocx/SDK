<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing contacts with optional filters
 */
final class ListContactsRequest
{
    /**
     * @param string|string[]|null $companyIds
     */
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
        public readonly ?string $companyId = null,
        /** Several companies (listContacts only) */
        public readonly string|array|null $companyIds = null,
        // Sort column: 'name' | 'createdOn' (default createdOn, newest first)
        public readonly ?string $sortBy = null,
        // 'asc' | 'desc'
        public readonly ?string $sortDirection = null,
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
        if ($this->companyId !== null) {
            $params['companyId'] = $this->companyId;
        }

        if ($this->companyIds !== null) {
            $params['companyIds'] = $this->companyIds;
        }
        if ($this->sortBy !== null) {
            $params['sortBy'] = $this->sortBy;
        }
        if ($this->sortDirection !== null) {
            $params['sortDirection'] = $this->sortDirection;
        }

        return $params;
    }
}
