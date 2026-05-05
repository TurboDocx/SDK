<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\Quote;

/**
 * Response from listing quotes
 */
final class QuoteListResponse implements \JsonSerializable
{
    /**
     * @param array<Quote> $results
     * @param array<string, mixed>|null $stats
     */
    public function __construct(
        public readonly array $results,
        public readonly int $totalRecords,
        public readonly ?array $stats = null,
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
            stats: $data['stats'] ?? null,
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
            $data['stats'] = $this->stats;
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
