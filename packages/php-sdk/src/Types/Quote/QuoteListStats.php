<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Aggregate statistics returned with quote list responses
 */
final class QuoteListStats implements \JsonSerializable
{
    /**
     * @param array<CurrencyTotal> $totalPipeline
     * @param array<CurrencyTotal> $monthlyRecurringRevenue
     */
    public function __construct(
        public readonly int $total,
        public readonly int $draft,
        public readonly int $sent,
        public readonly int $accepted,
        public readonly int $declined,
        public readonly int $voided,
        public readonly array $totalPipeline,
        public readonly int $activeQuotes,
        public readonly array $monthlyRecurringRevenue,
        public readonly float $winRate,
        public readonly float $avgMargin,
        public readonly int $quotesThisMonth,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            total: (int) ($data['total'] ?? 0),
            draft: (int) ($data['draft'] ?? 0),
            sent: (int) ($data['sent'] ?? 0),
            accepted: (int) ($data['accepted'] ?? 0),
            declined: (int) ($data['declined'] ?? 0),
            voided: (int) ($data['voided'] ?? 0),
            totalPipeline: array_map(
                fn(array $item) => CurrencyTotal::fromArray($item),
                $data['totalPipeline'] ?? []
            ),
            activeQuotes: (int) ($data['activeQuotes'] ?? 0),
            monthlyRecurringRevenue: array_map(
                fn(array $item) => CurrencyTotal::fromArray($item),
                $data['monthlyRecurringRevenue'] ?? []
            ),
            winRate: (float) ($data['winRate'] ?? 0),
            avgMargin: (float) ($data['avgMargin'] ?? 0),
            quotesThisMonth: (int) ($data['quotesThisMonth'] ?? 0),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'total' => $this->total,
            'draft' => $this->draft,
            'sent' => $this->sent,
            'accepted' => $this->accepted,
            'declined' => $this->declined,
            'voided' => $this->voided,
            'totalPipeline' => array_map(
                fn(CurrencyTotal $ct) => $ct->toArray(),
                $this->totalPipeline
            ),
            'activeQuotes' => $this->activeQuotes,
            'monthlyRecurringRevenue' => array_map(
                fn(CurrencyTotal $ct) => $ct->toArray(),
                $this->monthlyRecurringRevenue
            ),
            'winRate' => $this->winRate,
            'avgMargin' => $this->avgMargin,
            'quotesThisMonth' => $this->quotesThisMonth,
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
