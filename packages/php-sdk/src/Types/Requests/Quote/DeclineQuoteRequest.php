<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for declining a quote
 */
final class DeclineQuoteRequest
{
    public function __construct(
        public readonly string $reason,
    ) {}

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return ['reason' => $this->reason];
    }
}
