<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from getRecipients — every recipient on a document with their signing status,
 * plus who sent the document and a pending/viewed/completed roll-up.
 */
final class DocumentRecipientsResponse
{
    /**
     * @param RecipientsDocument $document
     * @param array<RecipientSignatureStatus> $recipients
     * @param RecipientStatusSummary $summary
     */
    public function __construct(
        public RecipientsDocument $document,
        public array $recipients,
        public RecipientStatusSummary $summary,
    ) {}

    /**
     * Create from array
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $recipients = array_map(
            fn(array $r) => RecipientSignatureStatus::fromArray($r),
            $data['recipients'] ?? []
        );

        return new self(
            document: RecipientsDocument::fromArray($data['document'] ?? []),
            recipients: $recipients,
            summary: RecipientStatusSummary::fromArray($data['summary'] ?? []),
        );
    }
}
