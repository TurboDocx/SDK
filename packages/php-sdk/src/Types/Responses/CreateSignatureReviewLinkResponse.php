<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from createSignatureReviewLink
 */
final class CreateSignatureReviewLinkResponse
{
    /**
     * The recipients the API created. The API always sends them on a successful response; this is
     * never null (an empty array if the key is absent or null was passed to the constructor).
     *
     * @var array<mixed>
     */
    public array $recipients;

    /**
     * @param bool $success
     * @param string $documentId
     * @param string $status
     * @param string|null $previewUrl
     * @param array<mixed>|null $recipients The API always sends it on success; null is coalesced to []
     * @param string $message
     */
    public function __construct(
        public bool $success,
        public string $documentId,
        public string $status,
        public ?string $previewUrl,
        ?array $recipients,
        public string $message,
    ) {
        $this->recipients = $recipients ?? [];
    }

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
            recipients: $data['recipients'] ?? [],
            message: $data['message'] ?? '',
        );
    }
}
