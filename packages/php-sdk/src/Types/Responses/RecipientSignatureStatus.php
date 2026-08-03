<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Where a single recipient is in the signing process.
 */
final class RecipientSignatureStatus
{
    /**
     * @param string $status One of 'pending', 'viewed', 'completed'.
     * @param string|null $signedOn When this recipient signed; null while pending or viewed.
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public string $status,
        public ?string $signedOn,
        public int $signingOrder,
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
            name: $data['name'] ?? '',
            email: $data['email'] ?? '',
            status: $data['status'] ?? '',
            signedOn: $data['signedOn'] ?? null,
            signingOrder: (int) ($data['signingOrder'] ?? 0),
        );
    }
}
