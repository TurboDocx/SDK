<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

use TurboDocx\Types\DocumentStatus;

/**
 * Response from getStatus
 */
final class DocumentStatusResponse
{
    /**
     * @param string $documentId
     * @param DocumentStatus $status
     * @param string $name
     * @param array<RecipientResponse> $recipients
     * @param string $createdAt
     * @param string $updatedAt
     * @param string|null $completedAt
     */
    public function __construct(
        public string $documentId,
        public DocumentStatus $status,
        public string $name,
        public array $recipients,
        public string $createdAt,
        public string $updatedAt,
        public ?string $completedAt,
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
            fn(array $r) => RecipientResponse::fromArray($r),
            $data['recipients'] ?? []
        );

        return new self(
            documentId: $data['documentId'] ?? '',
            status: DocumentStatus::from($data['status'] ?? 'draft'),
            name: $data['name'] ?? '',
            recipients: $recipients,
            createdAt: $data['createdAt'] ?? '',
            updatedAt: $data['updatedAt'] ?? '',
            completedAt: $data['completedAt'] ?? null,
        );
    }
}
