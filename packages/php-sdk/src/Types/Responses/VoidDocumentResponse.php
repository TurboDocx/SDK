<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from void
 */
final class VoidDocumentResponse
{
    public function __construct(
        public string $id,
        public string $name,
        public string $status,
        public ?string $voidReason = null,
        public ?string $voidedAt = null,
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
            status: $data['status'] ?? '',
            voidReason: $data['voidReason'] ?? null,
            voidedAt: $data['voidedAt'] ?? null,
        );
    }
}
