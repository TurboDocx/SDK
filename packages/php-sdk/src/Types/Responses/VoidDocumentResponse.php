<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from void
 */
final class VoidDocumentResponse
{
    public function __construct(
        public string $documentId,
        public string $status,
        public string $voidedAt,
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
            documentId: $data['documentId'] ?? '',
            status: $data['status'] ?? '',
            voidedAt: $data['voidedAt'] ?? '',
        );
    }
}
