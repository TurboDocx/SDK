<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\Quote;
use TurboDocx\Types\Quote\QuoteListStats;
use TurboDocx\Types\Quote\QuoteStatusCounts;
use TurboDocx\Types\Quote\QuoteSummary;

/**
 * Response from listing quotes
 */
final class QuoteListResponse implements \JsonSerializable
{
    /**
     * @param array<Quote> $results
     */
    public function __construct(
        public readonly array $results,
        public readonly int $totalRecords,
        public readonly ?QuoteListStats $stats = null,
        // Quotes per list tab (every filter except the status filter)
        public readonly ?QuoteStatusCounts $statusCounts = null,
        // The list's summary cards, in one currency
        public readonly ?QuoteSummary $summary = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            results: array_map(
                fn(array $q) => Quote::fromArray($q),
                $data['results'] ?? []
            ),
            totalRecords: (int) ($data['totalRecords'] ?? 0),
            stats: isset($data['stats']) ? QuoteListStats::fromArray($data['stats']) : null,
            statusCounts: isset($data['statusCounts']) ? QuoteStatusCounts::fromArray($data['statusCounts']) : null,
            summary: isset($data['summary']) ? QuoteSummary::fromArray($data['summary']) : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'results' => array_map(fn(Quote $q) => $q->toArray(), $this->results),
            'totalRecords' => $this->totalRecords,
        ];

        if ($this->stats !== null) {
            $data['stats'] = $this->stats->toArray();
        }
        if ($this->statusCounts !== null) {
            $data['statusCounts'] = $this->statusCounts->toArray();
        }
        if ($this->summary !== null) {
            $data['summary'] = $this->summary->toArray();
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
