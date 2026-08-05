<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Partner;

use TurboDocx\Types\Partner\PartnerOrgPreferences;

/**
 * Response from reading or updating an organization's partner-settable preferences
 */
final class PartnerOrgPreferencesResponse implements \JsonSerializable
{
    public function __construct(
        public readonly bool $success,
        public readonly PartnerOrgPreferences $preferences,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        $responseData = $data['data'] ?? $data;
        $preferences = $responseData['preferences'] ?? [];

        return new self(
            success: (bool) ($data['success'] ?? true),
            preferences: PartnerOrgPreferences::fromArray(is_array($preferences) ? $preferences : []),
        );
    }

    /**
     * Convert to array for serialization
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'data' => [
                'preferences' => $this->preferences->toArray(),
            ],
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
