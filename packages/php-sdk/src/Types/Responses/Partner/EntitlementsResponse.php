<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\Features;
use TurboDocx\Types\Partner\Tracking;

/**
 * Response from updating organization entitlements
 */
final class EntitlementsResponse implements \JsonSerializable
{
    public function __construct(
        public readonly bool $success,
        public readonly ?Features $features = null,
        public readonly ?Tracking $tracking = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $responseData = $data['data'] ?? $data;

        return new self(
            success: (bool) ($data['success'] ?? true),
            features: isset($responseData['features']) ? Features::fromArray($responseData['features']) : null,
            tracking: isset($responseData['tracking']) ? Tracking::fromArray($responseData['tracking']) : null,
        );
    }

    /**
     * Convert to array for serialization
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->features !== null) {
            $data['features'] = $this->features->toArray();
        }
        if ($this->tracking !== null) {
            $data['tracking'] = $this->tracking->toArray();
        }

        return [
            'success' => $this->success,
            'data' => $data,
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
