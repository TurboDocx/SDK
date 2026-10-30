<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * The number the next new quote will get (TurboQuote::getNextQuoteNumber). Read only: the
 * counter doesn't move, so a quote created by someone else in between takes it first.
 */
final class NextQuoteNumber implements \JsonSerializable
{
    public function __construct(
        public readonly string $nextNumber,
        public readonly int $sequence,
        // Whether the caller can change numbering (administrators)
        public readonly bool $canEdit = false,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            nextNumber: (string) ($data['nextNumber'] ?? ''),
            sequence: (int) ($data['sequence'] ?? 0),
            canEdit: (bool) ($data['canEdit'] ?? false),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'nextNumber' => $this->nextNumber,
            'sequence' => $this->sequence,
            'canEdit' => $this->canEdit,
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
