<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

/**
 * Simple message response (used for DELETE operations)
 */
final class MessageResponse implements \JsonSerializable
{
    public function __construct(
        public readonly string $message,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            message: $data['message'] ?? '',
        );
    }

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return ['message' => $this->message];
    }

    /**
     * @return array<string, string>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
