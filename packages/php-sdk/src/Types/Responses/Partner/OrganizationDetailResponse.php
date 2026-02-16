<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\Features;
use TurboDocx\Types\Partner\Organization;
use TurboDocx\Types\Partner\Tracking;

/**
 * Response from getting organization details (includes features and tracking)
 */
final class OrganizationDetailResponse implements \JsonSerializable
{
    public function __construct(
        public readonly bool $success,
        public readonly Organization $organization,
        public readonly ?Features $features = null,
        public readonly ?Tracking $tracking = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $orgData = $data['data'] ?? $data;

        return new self(
            success: (bool) ($data['success'] ?? true),
            organization: Organization::fromArray($orgData),
            features: isset($orgData['features']) ? Features::fromArray($orgData['features']) : null,
            tracking: isset($orgData['tracking']) ? Tracking::fromArray($orgData['tracking']) : null,
        );
    }

    /**
     * Convert to array for serialization
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = $this->organization->toArray();

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
