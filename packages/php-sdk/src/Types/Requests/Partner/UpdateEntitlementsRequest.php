<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

/**
 * Request for updating organization entitlements
 */
final class UpdateEntitlementsRequest
{
    /**
     * @param array<string, mixed>|null $features Feature limits and capabilities
     * @param array<string, mixed>|null $tracking Tracking limits
     */
    public function __construct(
        public readonly ?array $features = null,
        public readonly ?array $tracking = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->features !== null) {
            $data['features'] = $this->features;
        }
        if ($this->tracking !== null) {
            $data['tracking'] = $this->tracking;
        }

        return $data;
    }
}
