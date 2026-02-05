<?php

declare(strict_types=1);

namespace TurboDocx\Types\Partner;

/**
 * Organization tracking/usage domain type
 */
final class Tracking implements \JsonSerializable
{
    public function __construct(
        public readonly ?int $numUsers = null,
        public readonly ?int $numProjectspaces = null,
        public readonly ?int $numTemplates = null,
        public readonly ?int $storageUsed = null,
        public readonly ?int $numGeneratedDeliverables = null,
        public readonly ?int $numSignaturesUsed = null,
        public readonly ?int $currentAICredits = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            numUsers: isset($data['numUsers']) ? (int) $data['numUsers'] : null,
            numProjectspaces: isset($data['numProjectspaces']) ? (int) $data['numProjectspaces'] : null,
            numTemplates: isset($data['numTemplates']) ? (int) $data['numTemplates'] : null,
            storageUsed: isset($data['storageUsed']) ? (int) $data['storageUsed'] : null,
            numGeneratedDeliverables: isset($data['numGeneratedDeliverables']) ? (int) $data['numGeneratedDeliverables'] : null,
            numSignaturesUsed: isset($data['numSignaturesUsed']) ? (int) $data['numSignaturesUsed'] : null,
            currentAICredits: isset($data['currentAICredits']) ? (int) $data['currentAICredits'] : null,
        );
    }

    /**
     * Convert to array, filtering out null values
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'numUsers' => $this->numUsers,
            'numProjectspaces' => $this->numProjectspaces,
            'numTemplates' => $this->numTemplates,
            'storageUsed' => $this->storageUsed,
            'numGeneratedDeliverables' => $this->numGeneratedDeliverables,
            'numSignaturesUsed' => $this->numSignaturesUsed,
            'currentAICredits' => $this->currentAICredits,
        ], fn($value) => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
