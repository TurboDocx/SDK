<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

use TurboDocx\Types\RecipientStatus;

/**
 * Recipient information in document status response
 */
final class RecipientResponse
{
    public function __construct(
        public string $id,
        public string $email,
        public string $name,
        public RecipientStatus $status,
        public ?string $signUrl,
        public ?string $signedAt,
    ) {}

    /**
     * Create from array
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            email: $data['email'] ?? '',
            name: $data['name'] ?? '',
            status: RecipientStatus::from($data['status'] ?? 'pending'),
            signUrl: $data['signUrl'] ?? null,
            signedAt: $data['signedAt'] ?? null,
        );
    }
}
