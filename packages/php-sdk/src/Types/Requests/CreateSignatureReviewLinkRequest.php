<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

use TurboDocx\Types\Recipient;
use TurboDocx\Types\Field;

/**
 * Request for createSignatureReviewLink - prepare document without sending emails
 */
final class CreateSignatureReviewLinkRequest
{
    /**
     * @param array<Recipient> $recipients Recipients who will sign
     * @param array<Field> $fields Signature fields configuration
     * @param string|null $file PDF file content as bytes
     * @param string|null $fileName Original filename (used when file is provided)
     * @param string|null $fileLink URL to document file
     * @param string|null $deliverableId TurboDocx deliverable ID
     * @param string|null $templateId TurboDocx template ID
     * @param string|null $documentName Document name
     * @param string|null $documentDescription Document description
     * @param string|null $senderName Sender name (overrides configured value)
     * @param string|null $senderEmail Sender email (overrides configured value)
     * @param array<string>|null $ccEmails CC emails
     * @param bool|null $remindersEnabled Send reminder emails to signers who haven't signed
     * @param array{value:int,unit:string}|null $reminderDelay Time to the FIRST reminder
     * @param array{value:int,unit:string}|null $reminderInterval Gap between later reminders
     * @param int|null $maxReminders Cap per signer. -1 unlimited, 0 none. Never caps warnings.
     * @param bool|null $expirationEnabled Close the signing window after $expireAfter
     * @param array{value:int,unit:string}|null $expireAfter How long the document stays signable
     * @param array{value:int,unit:string}|null $expirationWarning How far before expiry warnings
     *     start. A zero value means no warnings at all.
     * @param array{value:int,unit:string}|null $expirationWarningInterval Gap between warnings
     */
    public function __construct(
        public array $recipients,
        public array $fields,
        public ?string $file = null,
        public ?string $fileName = null,
        public ?string $fileLink = null,
        public ?string $deliverableId = null,
        public ?string $templateId = null,
        public ?string $documentName = null,
        public ?string $documentDescription = null,
        public ?string $senderName = null,
        public ?string $senderEmail = null,
        public ?array $ccEmails = null,
        public ?bool $remindersEnabled = null,
        public ?array $reminderDelay = null,
        public ?array $reminderInterval = null,
        public ?int $maxReminders = null,
        public ?bool $expirationEnabled = null,
        public ?array $expireAfter = null,
        public ?array $expirationWarning = null,
        public ?array $expirationWarningInterval = null,
    ) {}
}
