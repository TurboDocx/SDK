<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Quote number configuration.
 *
 * Pairs the quote number format with the current per-period issued floor.
 */
final class QuoteNumberConfig implements \JsonSerializable
{
    public function __construct(
        public readonly QuoteNumberFormat $format,
        public readonly int $currentFloor,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            format: QuoteNumberFormat::fromArray($data['format'] ?? []),
            currentFloor: (int) ($data['currentFloor'] ?? 0),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'format' => $this->format->toArray(),
            'currentFloor' => $this->currentFloor,
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
