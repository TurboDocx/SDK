<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\Quote;

/**
 * Response from sending a quote with a deliverable
 */
final class SendQuoteWithDeliverableResponse implements \JsonSerializable
{
    public function __construct(
        public readonly Quote $quote,
        public readonly string $message,
        public readonly string $documentId,
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
            documentId: $data['documentId'] ?? '',
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
            'documentId' => $this->documentId,
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
