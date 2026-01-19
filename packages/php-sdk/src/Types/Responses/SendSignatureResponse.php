<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from sendSignature
 */
final class SendSignatureResponse
{
    public function __construct(
        public bool $success,
        public string $documentId,
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
            message: $data['message'] ?? '',
        );
    }
}
