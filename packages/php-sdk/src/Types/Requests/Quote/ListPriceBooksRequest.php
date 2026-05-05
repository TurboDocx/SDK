<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing price books with optional filters
 */
final class ListPriceBooksRequest
{
    /**
     * @param string|string[]|null $priceBookTypeIds
     */
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
        public readonly string|array|null $priceBookTypeIds = null,
        public readonly ?bool $showInQuoteBuilder = null,
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
        if ($this->priceBookTypeIds !== null) {
            if (is_array($this->priceBookTypeIds)) {
                $params['priceBookTypeIds'] = $this->priceBookTypeIds;
            } else {
                $params['priceBookTypeIds'] = $this->priceBookTypeIds;
            }
        }
        if ($this->showInQuoteBuilder !== null) {
            $params['showInQuoteBuilder'] = $this->showInQuoteBuilder ? 'true' : 'false';
        }

        return $params;
    }
}
