<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Roll-up of a document's roster, so callers can answer
 * "how many are we waiting on" without looping.
 */
final class RecipientStatusSummary
{
    public function __construct(
        public int $total,
        public int $pending,
        public int $viewed,
        public int $completed,
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
            total: (int) ($data['total'] ?? 0),
            pending: (int) ($data['pending'] ?? 0),
            viewed: (int) ($data['viewed'] ?? 0),
            completed: (int) ($data['completed'] ?? 0),
        );
    }
}
