<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from generating a template
 */
class GenerateTemplateResponse
{
    /**
     * @param bool $success Whether the operation was successful
     * @param string|null $deliverableId Generated deliverable ID
     * @param string|null $message Response message
     */
    public function __construct(
        public bool $success,
        public ?string $deliverableId = null,
        public ?string $message = null
    ) {}

    /**
     * Create from API response array
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            success: $data['success'] ?? false,
            deliverableId: $data['deliverableId'] ?? null,
            message: $data['message'] ?? null
        );
    }
}
