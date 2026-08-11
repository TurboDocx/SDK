<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * The identity that sent a document for signature.
 *
 * Never the synthetic API service account — the backend resolves the real sender.
 */
final class DocumentSender
{
    public function __construct(
        public string $name,
        public string $email,
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
            name: $data['name'] ?? '',
            email: $data['email'] ?? '',
        );
    }
}
