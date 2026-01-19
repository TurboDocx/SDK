<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from createSignatureReviewLink
 */
final class CreateSignatureReviewLinkResponse
{
    /**
     * @param bool $success
     * @param string $documentId
     * @param string $status
     * @param string|null $previewUrl
     * @param array<mixed>|null $recipients
     * @param string $message
     */
    public function __construct(
        public bool $success,
        public string $documentId,
        public string $status,
        public ?string $previewUrl,
        public ?array $recipients,
        public string $message,
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
            success: $data['success'] ?? false,
            documentId: $data['documentId'] ?? '',
            status: $data['status'] ?? '',
            previewUrl: $data['previewUrl'] ?? null,
            recipients: $data['recipients'] ?? null,
            message: $data['message'] ?? '',
        );
    }
}
