<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\Organization;

/**
 * Response from listing organizations
 */
final class OrganizationListResponse implements \JsonSerializable
{
    /**
     * @param bool $success
     * @param array<Organization> $results
     * @param int $totalRecords
     * @param int $limit
     * @param int $offset
     */
    public function __construct(
        public readonly bool $success,
        public readonly array $results,
        public readonly int $totalRecords,
        public readonly int $limit,
        public readonly int $offset,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $responseData = $data['data'] ?? $data;

        $results = array_map(
            fn(array $org) => Organization::fromArray($org),
            $responseData['results'] ?? []
        );

        return new self(
            success: (bool) ($data['success'] ?? true),
            results: $results,
            totalRecords: (int) ($responseData['totalRecords'] ?? 0),
            limit: (int) ($responseData['limit'] ?? 50),
            offset: (int) ($responseData['offset'] ?? 0),
        );
    }

    /**
     * Convert to array for serialization
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'data' => [
                'results' => array_map(fn(Organization $org) => $org->toArray(), $this->results),
                'totalRecords' => $this->totalRecords,
                'limit' => $this->limit,
                'offset' => $this->offset,
            ],
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
