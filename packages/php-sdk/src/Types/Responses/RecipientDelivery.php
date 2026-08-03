<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Email history for one recipient — every notification actually sent to them.
 *
 * CC notifications are excluded; a CC address is not a signer.
 */
final class RecipientDelivery
{
    /**
     * @param string|null $firstSentOn First email of any kind; null if never emailed.
     * @param string|null $lastSentOn Most recent email of any kind.
     * @param int $totalSent Request, resends, reminders, warnings and terminal notices.
     */
    public function __construct(
        public ?string $firstSentOn,
        public ?string $lastSentOn,
        public int $totalSent,
        public int $reminderCount,
        public ?string $lastRemindedAt,
        public int $warningCount,
        public ?string $lastWarningAt,
    ) {}

    /**
     * Create from array
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            firstSentOn: $data['firstSentOn'] ?? null,
            lastSentOn: $data['lastSentOn'] ?? null,
            totalSent: (int) ($data['totalSent'] ?? 0),
            reminderCount: (int) ($data['reminderCount'] ?? 0),
            lastRemindedAt: $data['lastRemindedAt'] ?? null,
            warningCount: (int) ($data['warningCount'] ?? 0),
            lastWarningAt: $data['lastWarningAt'] ?? null,
        );
    }
}
