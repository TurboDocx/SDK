<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\QuoteType;

/**
 * Response from listing types/categories
 */
final class QuoteTypeListResponse implements \JsonSerializable
{
    /**
     * @param array<QuoteType> $results
     */
    public function __construct(
        public readonly array $results,
        public readonly int $totalRecords,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            results: array_map(
                fn(array $t) => QuoteType::fromArray($t),
                $data['results'] ?? []
            ),
            totalRecords: (int) ($data['totalRecords'] ?? 0),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'results' => array_map(fn(QuoteType $t) => $t->toArray(), $this->results),
            'totalRecords' => $this->totalRecords,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
