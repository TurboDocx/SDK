<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\PriceBook;

/**
 * Response from listing price books
 */
final class PriceBookListResponse implements \JsonSerializable
{
    /**
     * @param array<PriceBook> $results
     */
    public function __construct(
        public readonly array $results,
        public readonly int $totalRecords,
        public readonly ?int $totalPriceBooks = null,
        public readonly ?int $activeInBuilder = null,
        public readonly ?int $totalProducts = null,
        public readonly ?string $defaultPriceBookName = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            results: array_map(
                fn(array $pb) => PriceBook::fromArray($pb),
                $data['results'] ?? []
            ),
            totalRecords: (int) ($data['totalRecords'] ?? 0),
            totalPriceBooks: isset($data['totalPriceBooks']) ? (int) $data['totalPriceBooks'] : null,
            activeInBuilder: isset($data['activeInBuilder']) ? (int) $data['activeInBuilder'] : null,
            totalProducts: isset($data['totalProducts']) ? (int) $data['totalProducts'] : null,
            defaultPriceBookName: $data['defaultPriceBookName'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'results' => array_map(fn(PriceBook $pb) => $pb->toArray(), $this->results),
            'totalRecords' => $this->totalRecords,
        ];

        if ($this->totalPriceBooks !== null) {
            $data['totalPriceBooks'] = $this->totalPriceBooks;
        }
        if ($this->activeInBuilder !== null) {
            $data['activeInBuilder'] = $this->activeInBuilder;
        }
        if ($this->totalProducts !== null) {
            $data['totalProducts'] = $this->totalProducts;
        }
        if ($this->defaultPriceBookName !== null) {
            $data['defaultPriceBookName'] = $this->defaultPriceBookName;
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
