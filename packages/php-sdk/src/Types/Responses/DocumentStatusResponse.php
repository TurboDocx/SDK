<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from getStatus
 *
 * Note: Simplified to match JS/Python/Go/Java SDKs which only return status string
 */
final class DocumentStatusResponse
{
    /**
     * @param string $status Document status (e.g., 'draft', 'under_review', 'completed', 'voided')
     */
    public function __construct(
        public string $status,
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
        );
    }
}
