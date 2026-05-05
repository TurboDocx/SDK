<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing quote templates
 */
final class ListTemplatesRequest
{
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
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

        return $params;
    }
}
