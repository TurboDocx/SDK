<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\LineItem;

/**
 * Response from listing line items
 */
final class LineItemListResponse implements \JsonSerializable
{
    /**
     * @param array<LineItem> $results
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
                fn(array $item) => LineItem::fromArray($item),
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
            'results' => array_map(fn(LineItem $item) => $item->toArray(), $this->results),
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
