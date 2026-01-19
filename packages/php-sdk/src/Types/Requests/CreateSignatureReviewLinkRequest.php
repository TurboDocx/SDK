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
    ) {}
}
