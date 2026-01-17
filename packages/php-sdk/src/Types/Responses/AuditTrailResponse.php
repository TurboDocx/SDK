<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from getAuditTrail
 */
final readonly class AuditTrailResponse
{
    /**
     * @param string $documentId
     * @param array<AuditTrailEntry> $entries
     */
    public function __construct(
        public string $documentId,
        public array $entries,
    ) {}

    /**
     * Create from array
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $entries = array_map(
            fn(array $e) => AuditTrailEntry::fromArray($e),
            $data['entries'] ?? []
        );

        return new self(
            documentId: $data['documentId'] ?? '',
            entries: $entries,
        );
    }
}
