<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from getAuditTrail
 */
final class AuditTrailResponse
{
    /**
     * @param AuditTrailDocument $document
     * @param array<AuditTrailEntry> $auditTrail
     */
    public function __construct(
        public AuditTrailDocument $document,
        public array $auditTrail,
    ) {}

    /**
     * Create from array
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $document = AuditTrailDocument::fromArray($data['document'] ?? []);

        $auditTrail = array_map(
            fn(array $e) => AuditTrailEntry::fromArray($e),
            $data['auditTrail'] ?? []
        );

        return new self(
            document: $document,
            auditTrail: $auditTrail,
        );
    }
}
