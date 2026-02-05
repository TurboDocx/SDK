<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\PartnerApiKey;

/**
 * Response from creating or updating a partner API key
 */
final class PartnerApiKeyResponse implements \JsonSerializable
{
    public function __construct(
        public readonly bool $success,
        public readonly PartnerApiKey $data,
        public readonly ?string $message = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        // Response may have data in 'data' or 'apiKey' depending on endpoint
        $keyData = $data['data'] ?? $data['apiKey'] ?? $data;

        return new self(
            success: (bool) ($data['success'] ?? true),
            data: PartnerApiKey::fromArray($keyData),
            message: $data['message'] ?? null,
        );
    }

    /**
     * Convert to array for serialization
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $result = [
            'success' => $this->success,
            'data' => $this->data->toArray(),
        ];

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
