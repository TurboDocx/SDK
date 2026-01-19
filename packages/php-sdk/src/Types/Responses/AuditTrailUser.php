<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * User information in audit trail entries
 */
final class AuditTrailUser
{
    public function __construct(
        public string $name,
        public string $email,
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
            name: $data['name'] ?? '',
            email: $data['email'] ?? '',
        );
    }
}
