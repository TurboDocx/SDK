<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

/**
 * Generic success response (used for DELETE operations and simple confirmations)
 */
final class SuccessResponse implements \JsonSerializable
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $message = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            success: (bool) ($data['success'] ?? true),
            message: $data['message'] ?? null,
        );
    }

    /**
     * Convert to array for serialization
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $result = ['success' => $this->success];

        if ($this->message !== null) {
            $result['message'] = $this->message;
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
