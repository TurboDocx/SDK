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
     * Returns an object (not an empty array) when there is no reason: PHP encodes `[]` as the JSON
     * array `[]`, which the API rejects with `"value" must be of type object`.
     *
     * @return array<string, string>|\stdClass
     */
    public function toArray(): array|\stdClass
    {
        return $this->reason === null ? new \stdClass() : ['reason' => $this->reason];
    }
}
