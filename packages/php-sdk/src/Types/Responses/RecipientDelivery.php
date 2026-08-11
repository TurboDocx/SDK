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
     * @param int $reminderCount Automatic (scheduled) reminders only — the counter
     *   maxReminders caps. A manual "remind now" does NOT increment it (it must not consume
     *   the cap budget), though it does land in $totalSent. So this can read 0 while
     *   reminder emails have genuinely been sent.
     * @param string|null $lastRemindedAt When the reminder cadence clock was last reset —
     *   NOT necessarily when a reminder was sent. Stamped by the initial signature-request
     *   send, each scheduled reminder, each manual "remind now", and each expiry warning.
     *   Only scheduled reminders bump $reminderCount, so a freshly-sent document normally
     *   shows a non-null value here alongside $reminderCount 0.
     * @param int $warningCount Expiry warnings sent. Only a warning touches this.
     * @param string|null $lastWarningAt When the last expiry warning went out.
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
