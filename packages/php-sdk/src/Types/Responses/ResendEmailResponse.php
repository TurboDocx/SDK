<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from resend
 */
final class ResendEmailResponse
{
    public function __construct(
        public bool $success,
        public int $recipientCount,
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
            success: $data['success'] ?? true,
            recipientCount: $data['recipientCount'] ?? 0,
        );
    }
}
