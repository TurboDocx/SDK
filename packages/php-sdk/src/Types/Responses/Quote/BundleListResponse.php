<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\Bundle;

/**
 * Response from listing bundles
 */
final class BundleListResponse implements \JsonSerializable
{
    /**
     * @param array<Bundle> $results
     */
    public function __construct(
        public readonly array $results,
        public readonly int $totalRecords,
        public readonly ?int $totalBundles = null,
        public readonly ?int $activeBundles = null,
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
                fn(array $b) => Bundle::fromArray($b),
                $data['results'] ?? []
            ),
            totalRecords: (int) ($data['totalRecords'] ?? 0),
            totalBundles: isset($data['totalBundles']) ? (int) $data['totalBundles'] : null,
            activeBundles: isset($data['activeBundles']) ? (int) $data['activeBundles'] : null,
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
            'results' => array_map(fn(Bundle $b) => $b->toArray(), $this->results),
            'totalRecords' => $this->totalRecords,
        ];

        if ($this->totalBundles !== null) {
            $data['totalBundles'] = $this->totalBundles;
        }
        if ($this->activeBundles !== null) {
            $data['activeBundles'] = $this->activeBundles;
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
