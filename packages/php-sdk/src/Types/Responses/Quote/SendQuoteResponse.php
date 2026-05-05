<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\Quote;

/**
 * Response from sending a quote
 */
final class SendQuoteResponse implements \JsonSerializable
{
    public function __construct(
        public readonly Quote $quote,
        public readonly string $message,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            quote: Quote::fromArray($data['result'] ?? $data['quote'] ?? []),
            message: $data['message'] ?? '',
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'quote' => $this->quote->toArray(),
            'message' => $this->message,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
