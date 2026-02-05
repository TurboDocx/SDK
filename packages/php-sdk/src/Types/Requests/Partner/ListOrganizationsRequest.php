<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

/**
 * Request for listing organizations with pagination and search
 */
final class ListOrganizationsRequest
{
    /**
     * @param int $limit Max results per page (1-100, default 50)
     * @param int $offset Pagination offset (default 0)
     * @param string|null $search Search term for filtering by name
     */
    public function __construct(
        public readonly int $limit = 50,
        public readonly int $offset = 0,
        public readonly ?string $search = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toQueryParams(): array
    {
        $params = [
            'limit' => $this->limit,
            'offset' => $this->offset,
        ];

        if ($this->search !== null) {
            $params['search'] = $this->search;
        }

        return $params;
    }
}
