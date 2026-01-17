<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Single audit trail entry
 */
final class AuditTrailEntry
{
    /**
     * @param string $event
     * @param string $actor
     * @param string $timestamp
     * @param string|null $ipAddress
     * @param array<string, mixed>|null $details
     */
    public function __construct(
        public string $event,
        public string $actor,
        public string $timestamp,
        public ?string $ipAddress,
        public ?array $details,
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
            event: $data['event'] ?? '',
            actor: $data['actor'] ?? '',
            timestamp: $data['timestamp'] ?? '',
            ipAddress: $data['ipAddress'] ?? null,
            details: $data['details'] ?? null,
        );
    }
}
