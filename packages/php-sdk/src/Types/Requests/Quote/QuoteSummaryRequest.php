<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Filters for TurboQuote::getQuoteSummary — the same filters as listing quotes (the status
 * filter is ignored by the summary), plus the currency the summary is in.
 */
final class QuoteSummaryRequest
{
    /**
     * @param string|string[]|null $companyIds
     * @param string|string[]|null $currency
     * @param string|string[]|null $currencies
     * @param string|string[]|null $createdBy
     */
    public function __construct(
        public readonly ?string $query = null,
        public readonly ?string $companyId = null,
        public readonly string|array|null $companyIds = null,
        public readonly ?string $contactId = null,
        public readonly string|array|null $currency = null,
        public readonly string|array|null $currencies = null,
        public readonly string|array|null $createdBy = null,
        public readonly ?bool $createdByApiKeys = null,
        public readonly ?string $validUntilWindow = null,
        public readonly ?string $validUntilFrom = null,
        public readonly ?string $validUntilTo = null,
        public readonly ?string $summaryCurrency = null,
    ) {}

    /**
     * @return array<string, string|string[]>
     */
    public function toQueryParams(): array
    {
        return self::filterParams([
            'query' => $this->query,
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
            'summaryCurrency' => $this->summaryCurrency,
        ]);
    }

    /**
     * Query params from the set filters: null values are left out, booleans become
     * "true" / "false", arrays stay arrays (repeated params).
     *
     * @param array<string, string|string[]|bool|null> $filters
     * @return array<string, string|string[]>
     */
    public static function filterParams(array $filters): array
    {
        $params = [];
        foreach ($filters as $key => $value) {
            if ($value === null) {
                continue;
            }
            $params[$key] = is_bool($value) ? ($value ? 'true' : 'false') : $value;
        }
        return $params;
    }
}
