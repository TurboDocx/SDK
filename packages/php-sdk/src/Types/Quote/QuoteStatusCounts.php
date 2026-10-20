<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Quotes per quote list tab. Every list filter applies except the status filter, so each count
 * is what that tab would hold. `expired` overlaps `draft` and `sent`.
 */
final class QuoteStatusCounts implements \JsonSerializable
{
    public function __construct(
        public readonly int $all = 0,
        public readonly int $draft = 0,
        public readonly int $sent = 0,
        public readonly int $accepted = 0,
        public readonly int $declined = 0,
        public readonly int $voided = 0,
        public readonly int $expired = 0,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            all: (int) ($data['all'] ?? 0),
            draft: (int) ($data['draft'] ?? 0),
            sent: (int) ($data['sent'] ?? 0),
            accepted: (int) ($data['accepted'] ?? 0),
            declined: (int) ($data['declined'] ?? 0),
            voided: (int) ($data['voided'] ?? 0),
            expired: (int) ($data['expired'] ?? 0),
        );
    }

    /**
     * @return array<string, int>
     */
    public function toArray(): array
    {
        return [
            'all' => $this->all,
            'draft' => $this->draft,
            'sent' => $this->sent,
            'accepted' => $this->accepted,
            'declined' => $this->declined,
            'voided' => $this->voided,
            'expired' => $this->expired,
        ];
    }

    /**
     * @return array<string, int>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
