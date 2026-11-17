<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

use TurboDocx\Types\Recipient;
use TurboDocx\Types\Field;

/**
 * Request for sendSignature - prepare and send in single call
 */
final class SendSignatureRequest
{
    /**
     * @param array<Recipient> $recipients Recipients who will sign
     * @param array<Field> $fields Signature fields configuration. Optional when sending a template
     *     set up in TurboDocx with signer roles: give each recipient a `role` and the fields saved for
     *     that role are used (any fields you pass here are added to them).
     * @param string|null $file PDF file content as bytes
     * @param string|null $fileName Stored file name for an uploaded file (non-empty, max 255 chars; no extension needed)
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
     * @param bool|null $sendEmail Whether the backend emails the recipients their signing link (and
     *     the initial CC notice). Omit to keep the default (emails sent). Set `false` for embedded
     *     signing, where your app shows the signing page: the document still goes out for signing,
     *     and passcode and completed-copy emails are still sent. Presence is tested with
     *     `!== null`, so `false` is forwarded rather than dropped.
     * @param bool $fitAnchoredTags Places each field sent with a template anchor that is one
     *     single-brace tag such as `{ClientSign}` (with `replace` placement or none, and without
     *     `useRegex`) the way a template's saved setup field is placed: measured from the
     *     document's text and, with no template size, fitted to its tag's line; with a size,
     *     centred on its tag. A tag missing from the document still fails the request. Works with
     *     a file, file link, template ID or deliverable ID. Off by default; sent only when true.
     */
    public function __construct(
        public array $recipients,
        public array $fields = [],
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
        public ?bool $sendEmail = null,
        public bool $fitAnchoredTags = false,
    ) {}
}
