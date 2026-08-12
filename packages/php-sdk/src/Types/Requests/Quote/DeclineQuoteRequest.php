<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for declining a quote
 *
 * A draft quote may be declined without a reason; a sent quote still requires one.
 */
final class DeclineQuoteRequest
{
    /**
     * @param string|null $reason Optional for a draft quote, still required by the API for a sent one
     */
    public function __construct(
        public readonly ?string $reason = null,
    ) {}

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return $this->reason === null ? [] : ['reason' => $this->reason];
    }
}
