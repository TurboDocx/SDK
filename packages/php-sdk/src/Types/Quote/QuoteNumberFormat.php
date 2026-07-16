<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Quote number format configuration.
 *
 * Defines how generated quote numbers are formatted. All eight fields are
 * sent verbatim (camelCase) when updating the org's quote number config.
 *
 * Valid token values (see the matching enums in TurboDocx\Types\Enums):
 * - $yearToken:    'none' | 'two' | 'four'          — {@see \TurboDocx\Types\Enums\QuoteNumberYearToken}
 * - $monthToken:   'off' | 'two'                    — {@see \TurboDocx\Types\Enums\QuoteNumberMonthToken}
 * - $resetCadence: 'never' | 'yearly' | 'monthly'   — {@see \TurboDocx\Types\Enums\QuoteNumberResetCadence}
 */
final class QuoteNumberFormat implements \JsonSerializable
{
    public function __construct(
        public readonly string $prefix,
        public readonly string $yearToken,
        public readonly string $monthToken,
        public readonly string $separator,
        public readonly int $padWidth,
        public readonly string $suffix,
        public readonly int $startNumber,
        public readonly string $resetCadence,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            prefix: $data['prefix'] ?? '',
            yearToken: $data['yearToken'] ?? 'none',
            monthToken: $data['monthToken'] ?? 'off',
            separator: $data['separator'] ?? '',
            padWidth: (int) ($data['padWidth'] ?? 0),
            suffix: $data['suffix'] ?? '',
            startNumber: (int) ($data['startNumber'] ?? 0),
            resetCadence: $data['resetCadence'] ?? 'never',
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'prefix' => $this->prefix,
            'yearToken' => $this->yearToken,
            'monthToken' => $this->monthToken,
            'separator' => $this->separator,
            'padWidth' => $this->padWidth,
            'suffix' => $this->suffix,
            'startNumber' => $this->startNumber,
            'resetCadence' => $this->resetCadence,
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
