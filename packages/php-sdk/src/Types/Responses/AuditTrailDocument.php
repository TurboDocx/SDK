<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Document information in audit trail response
 */
final class AuditTrailDocument
{
    public function __construct(
        public string $id,
        public string $name,
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
        );
    }
}
