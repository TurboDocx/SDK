<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\OpenQuoteSummary;

/**
 * The open quotes that block deleting a company or contact: the newest 50, and how many in all
 */
final class OpenQuotesResponse implements \JsonSerializable
{
    /**
     * @param array<OpenQuoteSummary> $results
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
                fn(array $q) => OpenQuoteSummary::fromArray($q),
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
            'results' => array_map(fn(OpenQuoteSummary $q) => $q->toArray(), $this->results),
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
