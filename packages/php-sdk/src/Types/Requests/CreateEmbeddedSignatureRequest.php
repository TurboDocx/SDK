<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

use TurboDocx\Types\Field;

/**
 * Request for {@see \TurboDocx\TurboSign::createEmbeddedSignature()} — create a signature request
 * and mint a per-recipient embed URL in one call. Mirrors the TypeScript SDK's
 * `CreateEmbeddedSignatureRequest`.
 */
final class CreateEmbeddedSignatureRequest
{
    /**
     * @param array<EmbeddedSignatureRecipient> $recipients Signers, in the order they should sign
     * @param string|null $file PDF file content as bytes
     * @param string|null $fileName Original filename (used when file is provided)
     * @param string|null $fileLink URL to document file
     * @param string|null $templateId TurboDocx template ID
     * @param string|null $deliverableId TurboDocx deliverable ID
     * @param string|null $documentName Document name
     * @param string|null $documentDescription Document description
     * @param string|null $senderName Sender name (overrides configured value)
     * @param string|null $senderEmail Sender email (overrides configured value)
     * @param array<string>|null $ccEmails CC emails
     * @param array<Field>|null $fields Optional full field control; overrides the per-recipient
     *     `fields` shorthand when provided.
     * @param bool|null $sendEmail Embedded default: do not email the recipients (you own the UX).
     *     Defaults to `false` for this flow. Forwarded to the backend.
     * @param string|null $returnUrl Optional completion fallback (https). Passed to each embed URL.
     */
    public function __construct(
        public array $recipients,
        public ?string $file = null,
        public ?string $fileName = null,
        public ?string $fileLink = null,
        public ?string $templateId = null,
        public ?string $deliverableId = null,
        public ?string $documentName = null,
        public ?string $documentDescription = null,
        public ?string $senderName = null,
        public ?string $senderEmail = null,
        public ?array $ccEmails = null,
        public ?array $fields = null,
        public ?bool $sendEmail = null,
        public ?string $returnUrl = null,
    ) {}
}
