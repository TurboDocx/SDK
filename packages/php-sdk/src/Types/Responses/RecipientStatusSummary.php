<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Roll-up of a document's roster, so callers can answer
 * "how many are we waiting on" without looping.
 */
final class RecipientStatusSummary
{
    /**
     * @param int $voided Signers stranded by a voided document.
     * @param int $expired Signers stranded by an expired document.
     * @param int $waitingOn Recipients who can still act (pending + viewed);
     *   zero once the document is terminal.
     */
    public function __construct(
        public int $total,
        public int $pending,
        public int $viewed,
        public int $completed,
        public int $voided,
        public int $expired,
        public int $waitingOn,
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
            voided: (int) ($data['voided'] ?? 0),
            expired: (int) ($data['expired'] ?? 0),
            waitingOn: (int) ($data['waitingOn'] ?? 0),
        );
    }
}
