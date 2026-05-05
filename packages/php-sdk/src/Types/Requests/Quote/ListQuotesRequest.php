<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing quotes with pagination and filters
 */
final class ListQuotesRequest
{
    /**
     * @param string|string[]|null $statuses
     */
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
        public readonly string|array|null $statuses = null,
        public readonly ?string $companyId = null,
        public readonly ?string $contactId = null,
        public readonly ?string $currency = null,
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
        if ($this->statuses !== null) {
            if (is_array($this->statuses)) {
                $params['statuses'] = $this->statuses;
            } else {
                $params['statuses'] = $this->statuses;
            }
        }
        if ($this->companyId !== null) {
            $params['companyId'] = $this->companyId;
        }
        if ($this->contactId !== null) {
            $params['contactId'] = $this->contactId;
        }
        if ($this->currency !== null) {
            $params['currency'] = $this->currency;
        }

        return $params;
    }
}
