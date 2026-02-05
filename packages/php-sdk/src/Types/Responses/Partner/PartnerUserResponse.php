<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\PartnerUser;

/**
 * Response from adding or updating a partner user
 */
final class PartnerUserResponse implements \JsonSerializable
{
    public function __construct(
        public readonly bool $success,
        public readonly PartnerUser $data,
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
            data: PartnerUser::fromArray($userData),
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
