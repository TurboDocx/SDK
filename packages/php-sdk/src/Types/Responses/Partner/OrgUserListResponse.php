<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\OrganizationUser;

/**
 * Response from listing organization users
 */
final class OrgUserListResponse implements \JsonSerializable
{
    /**
     * @param bool $success
     * @param array<OrganizationUser> $results
     * @param int $totalRecords
     * @param int $limit
     * @param int $offset
     * @param array<string, mixed>|null $userLimit User limit info
     */
    public function __construct(
        public readonly bool $success,
        public readonly array $results,
        public readonly int $totalRecords,
        public readonly int $limit,
        public readonly int $offset,
        public readonly ?array $userLimit = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $responseData = $data['data'] ?? $data;

        $results = array_map(
            fn(array $user) => OrganizationUser::fromArray($user),
            $responseData['results'] ?? []
        );

        return new self(
            success: (bool) ($data['success'] ?? true),
            results: $results,
            totalRecords: (int) ($responseData['totalRecords'] ?? 0),
            limit: (int) ($responseData['limit'] ?? 50),
            offset: (int) ($responseData['offset'] ?? 0),
            userLimit: $data['userLimit'] ?? null,
        );
    }

    /**
     * Convert to array for serialization
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $result = [
            'success' => $this->success,
            'data' => [
                'results' => array_map(fn(OrganizationUser $user) => $user->toArray(), $this->results),
                'totalRecords' => $this->totalRecords,
                'limit' => $this->limit,
                'offset' => $this->offset,
            ],
        ];

        if ($this->userLimit !== null) {
            $result['userLimit'] = $this->userLimit;
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
