<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * The document a set of recipients belongs to, as returned by getRecipients.
 */
final class RecipientsDocument
{
    /**
     * @param string $status Document-level status — the full SignatureDocumentStatus set
     *   ('draft', 'under_review', 'completed', 'voided', 'expired', …). For per-recipient
     *   display you do not need to overlay this yourself: each RecipientSignatureStatus
     *   already carries $effectiveStatus, the raw recipient status with this
     *   document-level outcome layered on.
     * @param string|null $sentOn When the document went out to recipients; null while a draft.
     * @param string|null $expiresAt When the signing window closes; null if it never expires.
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $status,
        public string $createdOn,
        public ?string $sentOn,
        public ?string $expiresAt,
        public DocumentSender $sentBy,
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
            id: $data['id'] ?? '',
            name: $data['name'] ?? '',
            status: $data['status'] ?? '',
            createdOn: $data['createdOn'] ?? '',
            sentOn: $data['sentOn'] ?? null,
            expiresAt: $data['expiresAt'] ?? null,
            sentBy: DocumentSender::fromArray($data['sentBy'] ?? []),
        );
    }
}
