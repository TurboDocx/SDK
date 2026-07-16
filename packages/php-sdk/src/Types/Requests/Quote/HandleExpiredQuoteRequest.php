<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for handling an expired sent quote.
 *
 * All three fields are required by the API.
 */
final class HandleExpiredQuoteRequest
{
    /**
     * @param string $action Either 'void' or 'decline' — no other value is accepted
     * @param string $reason Max 190 characters
     * @param string $newValidUntil ISO date carried onto the reissued duplicate
     */
    public function __construct(
        public readonly string $action,
        public readonly string $reason,
        public readonly string $newValidUntil,
    ) {}

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return [
            'action' => $this->action,
            'reason' => $this->reason,
            'newValidUntil' => $this->newValidUntil,
        ];
    }
}
