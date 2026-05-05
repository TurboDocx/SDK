<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for handling an expired sent quote
 */
final class HandleExpiredQuoteRequest
{
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
