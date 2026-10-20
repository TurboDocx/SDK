<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for listing quotes with pagination, filters and sorting
 *
 * Multi-value filters take one value or several (sent as repeated query params).
 * `statuses` also takes "expired": a draft or sent quote past its Valid until day (UTC), or
 * whose signature expired. `companyId` / `currency` are the original single filters; they merge
 * with `companyIds` / `currencies`.
 */
final class ListQuotesRequest
{
    /**
     * @param string|string[]|null $statuses
     * @param string|string[]|null $currency
     * @param string|string[]|null $companyIds
     * @param string|string[]|null $currencies
     * @param string|string[]|null $createdBy
     */
    public function __construct(
        public readonly ?int $limit = null,
        public readonly ?int $offset = null,
        public readonly ?string $query = null,
        public readonly string|array|null $statuses = null,
        public readonly ?string $companyId = null,
        public readonly ?string $contactId = null,
        public readonly string|array|null $currency = null,
        public readonly string|array|null $companyIds = null,
        public readonly string|array|null $currencies = null,
        // User ids of the quotes' creators (see TurboQuote::listQuoteCreators)
        public readonly string|array|null $createdBy = null,
        // Quotes created by any API key (ORed with createdBy)
        public readonly ?bool $createdByApiKeys = null,
        // 'thisWeek' | 'thisMonth' | 'past' (UTC days)
        public readonly ?string $validUntilWindow = null,
        // Inclusive YYYY-MM-DD bounds on Valid until
        public readonly ?string $validUntilFrom = null,
        public readonly ?string $validUntilTo = null,
        // 'updatedOn' | 'createdOn' | 'total' | 'validUntil' | 'quoteNumber' (default createdOn, newest first)
        public readonly ?string $sortBy = null,
        // 'asc' | 'desc'
        public readonly ?string $sortDirection = null,
        // Currency of the returned summary (default: the one filtered currency, else USD)
        public readonly ?string $summaryCurrency = null,
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

        return $params + QuoteSummaryRequest::filterParams([
            'query' => $this->query,
            'statuses' => $this->statuses,
            'companyId' => $this->companyId,
            'companyIds' => $this->companyIds,
            'contactId' => $this->contactId,
            'currency' => $this->currency,
            'currencies' => $this->currencies,
            'createdBy' => $this->createdBy,
            'createdByApiKeys' => $this->createdByApiKeys,
            'validUntilWindow' => $this->validUntilWindow,
            'validUntilFrom' => $this->validUntilFrom,
            'validUntilTo' => $this->validUntilTo,
            'sortBy' => $this->sortBy,
            'sortDirection' => $this->sortDirection,
            'summaryCurrency' => $this->summaryCurrency,
        ]);
    }
}
