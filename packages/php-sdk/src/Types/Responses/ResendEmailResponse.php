<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from resend
 */
final readonly class ResendEmailResponse
{
    public function __construct(
        public string $documentId,
        public string $message,
        public string $resentAt,
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
            documentId: $data['documentId'] ?? '',
            message: $data['message'] ?? '',
            resentAt: $data['resentAt'] ?? '',
        );
    }
}
