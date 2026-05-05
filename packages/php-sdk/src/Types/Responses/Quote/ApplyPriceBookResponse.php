<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\Quote;

/**
 * Response from applying a price book to a quote
 */
final class ApplyPriceBookResponse implements \JsonSerializable
{
    public function __construct(
        public readonly Quote $quote,
        public readonly string $message,
        public readonly int $updatedCount,
        public readonly int $skippedCount,
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
            updatedCount: (int) ($data['updatedCount'] ?? 0),
            skippedCount: (int) ($data['skippedCount'] ?? 0),
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
            'updatedCount' => $this->updatedCount,
            'skippedCount' => $this->skippedCount,
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
