<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * The quote list's summary cards, in one currency. Search, company, creator and Valid until
 * filters apply; the status filter and the currency list don't.
 */
final class QuoteSummary implements \JsonSerializable
{
    /**
     * @param array{total: float, count: int} $openPipeline Draft and sent quotes that aren't expired
     * @param array{accepted: int, declined: int} $completed Every accepted and every declined quote
     * @param array{count: int} $createdThisMonth Quotes created since the 1st of this month (UTC)
     * @param array{count: int} $waitingToSign Sent quotes that aren't expired
     * @param array{count: int} $wonThisMonth Quotes accepted since the 1st of this month (UTC)
     * @param string[] $currencies Every currency the org's quotes are in, A to Z
     * @param array{percent: float|null, accepted: int, declined: int, windowDays: int} $winRate
     *        accepted / (accepted + declined) over the last windowDays; percent is null when none were decided
     * @param array{total: float, count: int} $monthlyRecurring Monthly subtotal of accepted quotes
     */
    public function __construct(
        public readonly string $currency,
        public readonly array $openPipeline = ['total' => 0.0, 'count' => 0],
        public readonly array $completed = ['accepted' => 0, 'declined' => 0],
        public readonly array $createdThisMonth = ['count' => 0],
        public readonly array $waitingToSign = ['count' => 0],
        public readonly array $wonThisMonth = ['count' => 0],
        public readonly array $currencies = [],
        public readonly array $winRate = ['percent' => null, 'accepted' => 0, 'declined' => 0, 'windowDays' => 0],
        public readonly array $monthlyRecurring = ['total' => 0.0, 'count' => 0],
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $amount = fn(mixed $value): array => [
            'total' => (float) (is_array($value) ? ($value['total'] ?? 0) : 0),
            'count' => (int) (is_array($value) ? ($value['count'] ?? 0) : 0),
        ];
        $count = fn(mixed $value): array => ['count' => (int) (is_array($value) ? ($value['count'] ?? 0) : 0)];
        $completed = is_array($data['completed'] ?? null) ? $data['completed'] : [];
        $winRate = is_array($data['winRate'] ?? null) ? $data['winRate'] : [];

        return new self(
            currency: (string) ($data['currency'] ?? ''),
            openPipeline: $amount($data['openPipeline'] ?? null),
            completed: [
                'accepted' => (int) ($completed['accepted'] ?? 0),
                'declined' => (int) ($completed['declined'] ?? 0),
            ],
            createdThisMonth: $count($data['createdThisMonth'] ?? null),
            waitingToSign: $count($data['waitingToSign'] ?? null),
            wonThisMonth: $count($data['wonThisMonth'] ?? null),
            currencies: array_values(array_map('strval', is_array($data['currencies'] ?? null) ? $data['currencies'] : [])),
            winRate: [
                'percent' => isset($winRate['percent']) ? (float) $winRate['percent'] : null,
                'accepted' => (int) ($winRate['accepted'] ?? 0),
                'declined' => (int) ($winRate['declined'] ?? 0),
                'windowDays' => (int) ($winRate['windowDays'] ?? 0),
            ],
            monthlyRecurring: $amount($data['monthlyRecurring'] ?? null),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'currency' => $this->currency,
            'openPipeline' => $this->openPipeline,
            'completed' => $this->completed,
            'createdThisMonth' => $this->createdThisMonth,
            'waitingToSign' => $this->waitingToSign,
            'wonThisMonth' => $this->wonThisMonth,
            'currencies' => $this->currencies,
            'winRate' => $this->winRate,
            'monthlyRecurring' => $this->monthlyRecurring,
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
