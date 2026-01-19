<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Single audit trail entry - matches JS/Go/Java SDKs
 */
final class AuditTrailEntry
{
    /**
     * @param string $id Entry ID
     * @param string $documentId Document ID
     * @param string $actionType Action type (e.g., 'document_created', 'document_signed')
     * @param string $timestamp Timestamp of the event
     * @param string|null $previousHash Previous blockchain hash
     * @param string|null $currentHash Current blockchain hash
     * @param string|null $createdOn Created on timestamp
     * @param array<string, mixed>|null $details Additional details
     * @param AuditTrailUser|null $user User who performed the action
     * @param string|null $userId User ID
     * @param AuditTrailUser|null $recipient Recipient info
     * @param string|null $recipientId Recipient ID
     */
    public function __construct(
        public string $id,
        public string $documentId,
        public string $actionType,
        public string $timestamp,
        public ?string $previousHash,
        public ?string $currentHash,
        public ?string $createdOn,
        public ?array $details,
        public ?AuditTrailUser $user,
        public ?string $userId,
        public ?AuditTrailUser $recipient,
        public ?string $recipientId,
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
            documentId: $data['documentId'] ?? '',
            actionType: $data['actionType'] ?? '',
            timestamp: $data['timestamp'] ?? '',
            previousHash: $data['previousHash'] ?? null,
            currentHash: $data['currentHash'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            details: $data['details'] ?? null,
            user: isset($data['user']) ? AuditTrailUser::fromArray($data['user']) : null,
            userId: $data['userId'] ?? null,
            recipient: isset($data['recipient']) ? AuditTrailUser::fromArray($data['recipient']) : null,
            recipientId: $data['recipientId'] ?? null,
        );
    }
}
