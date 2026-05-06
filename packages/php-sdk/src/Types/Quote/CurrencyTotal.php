<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Represents a currency-total pair used in pipeline and MRR stats
 */
final class CurrencyTotal implements \JsonSerializable
{
    public function __construct(
        public readonly string $currency,
        public readonly float $total,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            currency: $data['currency'] ?? '',
            total: (float) ($data['total'] ?? 0),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'currency' => $this->currency,
            'total' => $this->total,
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
