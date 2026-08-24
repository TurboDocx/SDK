<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for sending a quote with a deliverable document
 */
final class SendQuoteWithDeliverableRequest
{
    /**
     * @param string[]|null $ccEmails
     * @param bool|null $remindersEnabled Send reminder emails to the contact who hasn't accepted
     * @param array{value:int,unit:string}|null $reminderDelay Time to the FIRST reminder
     * @param array{value:int,unit:string}|null $reminderInterval Gap between later reminders
     * @param int|null $maxReminders Cap on reminders. -1 unlimited, 0 none. Never caps warnings.
     * @param bool|null $expirationEnabled Close the quote after it expires
     * @param array{value:int,unit:string}|null $expireAfter Ignored for quotes — expiry is pinned
     *     to the quote's validUntil. Kept for signature-send parity.
     * @param array{value:int,unit:string}|null $expirationWarning How far before expiry warnings
     *     start. A zero value means no warnings at all.
     * @param array{value:int,unit:string}|null $expirationWarningInterval Gap between warnings
     */
    public function __construct(
        public readonly string $deliverableId,
        public readonly string $mergePosition,
        public readonly ?array $ccEmails = null,
        public readonly ?bool $remindersEnabled = null,
        public readonly ?array $reminderDelay = null,
        public readonly ?array $reminderInterval = null,
        public readonly ?int $maxReminders = null,
        public readonly ?bool $expirationEnabled = null,
        public readonly ?array $expireAfter = null,
        public readonly ?array $expirationWarning = null,
        public readonly ?array $expirationWarningInterval = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'deliverableId' => $this->deliverableId,
            'mergePosition' => $this->mergePosition,
        ];

        if ($this->ccEmails !== null) {
            $data['ccEmails'] = $this->ccEmails;
        }

        // Per-quote reminder + expiration overrides, sent FLAT on the JSON body. Durations stay
        // as {value, unit} arrays (quote send is a JSON endpoint — no multipart, so no JSON-string
        // encoding). Presence is null-checked, never truthiness: false (feature off) and 0 (no
        // reminders / never warn) are meaningful and must not fall back to the org default.
        if ($this->remindersEnabled !== null) {
            $data['remindersEnabled'] = $this->remindersEnabled;
        }
        if ($this->reminderDelay !== null) {
            $data['reminderDelay'] = $this->reminderDelay;
        }
        if ($this->reminderInterval !== null) {
            $data['reminderInterval'] = $this->reminderInterval;
        }
        if ($this->maxReminders !== null) {
            $data['maxReminders'] = $this->maxReminders;
        }
        if ($this->expirationEnabled !== null) {
            $data['expirationEnabled'] = $this->expirationEnabled;
        }
        if ($this->expireAfter !== null) {
            $data['expireAfter'] = $this->expireAfter;
        }
        if ($this->expirationWarning !== null) {
            $data['expirationWarning'] = $this->expirationWarning;
        }
        if ($this->expirationWarningInterval !== null) {
            $data['expirationWarningInterval'] = $this->expirationWarningInterval;
        }

        return $data;
    }
}
