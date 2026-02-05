<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\OrganizationUser;

/**
 * Response from adding or updating an organization user
 */
final class OrgUserResponse implements \JsonSerializable
{
    public function __construct(
        public readonly bool $success,
        public readonly OrganizationUser $data,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $userData = $data['data'] ?? $data;

        return new self(
            success: (bool) ($data['success'] ?? true),
            data: OrganizationUser::fromArray($userData),
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
            'data' => $this->data->toArray(),
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
