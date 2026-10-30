<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Someone who created quotes in the org: a person, or an API key (TurboQuote::listQuoteCreators).
 * The id is the value for the quote list's `createdBy` filter.
 */
final class QuoteCreator implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        // A person's name (else email), or the API key's name
        public readonly string $name,
        // Null for an API key
        public readonly ?string $email = null,
        public readonly bool $isAPIKey = false,
        // An API key that has since been deleted (its quotes stay)
        public readonly bool $apiKeyDeleted = false,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (string) ($data['id'] ?? ''),
            name: (string) ($data['name'] ?? ''),
            email: isset($data['email']) ? (string) $data['email'] : null,
            isAPIKey: (bool) ($data['isAPIKey'] ?? false),
            apiKeyDeleted: (bool) ($data['apiKeyDeleted'] ?? false),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'isAPIKey' => $this->isAPIKey,
            'apiKeyDeleted' => $this->apiKeyDeleted,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
