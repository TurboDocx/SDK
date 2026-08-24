<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from getStatus
 *
 * Carries the document status plus, when expiration is enabled, the signing-window
 * deadline (expiresAt). Matches the status/expiresAt shape returned by the JS/Python/Go/Java SDKs.
 */
final class DocumentStatusResponse
{
    /**
     * @param string $status Document status (e.g., 'draft', 'under_review', 'completed', 'voided', 'expired')
     * @param string|null $expiresAt ISO timestamp when the signing window closes, or null when expiration is off
     */
    public function __construct(
        public string $status,
        public ?string $expiresAt = null,
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
            status: $data['status'] ?? '',
            expiresAt: $data['expiresAt'] ?? null,
        );
    }
}
