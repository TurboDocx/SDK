<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\Product;

/**
 * Response from listing products
 */
final class ProductListResponse implements \JsonSerializable
{
    /**
     * @param array<Product> $results
     */
    public function __construct(
        public readonly array $results,
        public readonly int $totalRecords,
        public readonly ?int $totalProducts = null,
        public readonly ?int $activeProducts = null,
        public readonly ?int $totalCategories = null,
        public readonly ?float $catalogValue = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            results: array_map(
                fn(array $p) => Product::fromArray($p),
                $data['results'] ?? []
            ),
            totalRecords: (int) ($data['totalRecords'] ?? 0),
            totalProducts: isset($data['totalProducts']) ? (int) $data['totalProducts'] : null,
            activeProducts: isset($data['activeProducts']) ? (int) $data['activeProducts'] : null,
            totalCategories: isset($data['totalCategories']) ? (int) $data['totalCategories'] : null,
            catalogValue: isset($data['catalogValue']) ? (float) $data['catalogValue'] : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'results' => array_map(fn(Product $p) => $p->toArray(), $this->results),
            'totalRecords' => $this->totalRecords,
        ];

        if ($this->totalProducts !== null) {
            $data['totalProducts'] = $this->totalProducts;
        }
        if ($this->activeProducts !== null) {
            $data['activeProducts'] = $this->activeProducts;
        }
        if ($this->totalCategories !== null) {
            $data['totalCategories'] = $this->totalCategories;
        }
        if ($this->catalogValue !== null) {
            $data['catalogValue'] = $this->catalogValue;
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
