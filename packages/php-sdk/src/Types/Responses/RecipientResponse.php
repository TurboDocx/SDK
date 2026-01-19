<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Recipient information in API responses
 *
 * Note: Matches JS/Python/Go/Java SDKs - no status field
 */
final class RecipientResponse
{
    public function __construct(
        public string $id,
        public string $email,
        public string $name,
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
            signUrl: $data['signUrl'] ?? null,
            signedAt: $data['signedAt'] ?? null,
        );
    }
}
