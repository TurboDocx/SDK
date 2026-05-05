<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for voiding a quote
 */
final class VoidQuoteRequest
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
