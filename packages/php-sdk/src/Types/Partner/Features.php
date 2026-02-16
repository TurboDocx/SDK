<?php

declare(strict_types=1);

namespace TurboDocx\Types\Partner;

/**
 * Organization features/entitlements domain type
 */
final class Features implements \JsonSerializable
{
    public function __construct(
        public readonly ?string $orgId = null,
        public readonly ?int $maxUsers = null,
        public readonly ?int $maxProjectspaces = null,
        public readonly ?int $maxTemplates = null,
        public readonly ?int $maxStorage = null,
        public readonly ?int $maxGeneratedDeliverables = null,
        public readonly ?int $maxSignatures = null,
        public readonly ?int $maxAICredits = null,
        public readonly ?bool $rdWatermark = null,
        public readonly ?bool $hasFileDownload = null,
        public readonly ?bool $hasAdvancedDateFormats = null,
        public readonly ?bool $hasGDrive = null,
        public readonly ?bool $hasSharepoint = null,
        public readonly ?bool $hasSharepointOnly = null,
        public readonly ?bool $hasTDAI = null,
        public readonly ?bool $hasPptx = null,
        public readonly ?bool $hasTDWriter = null,
        public readonly ?bool $hasSalesforce = null,
        public readonly ?bool $hasWrike = null,
        public readonly ?bool $hasVariableStack = null,
        public readonly ?bool $hasSubvariables = null,
        public readonly ?bool $hasZapier = null,
        public readonly ?bool $hasBYOM = null,
        public readonly ?bool $hasBYOVS = null,
        public readonly ?bool $hasBetaFeatures = null,
        public readonly ?bool $enableBulkSending = null,
        public readonly ?string $createdBy = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            orgId: $data['orgId'] ?? null,
            maxUsers: isset($data['maxUsers']) ? (int) $data['maxUsers'] : null,
            maxProjectspaces: isset($data['maxProjectspaces']) ? (int) $data['maxProjectspaces'] : null,
            maxTemplates: isset($data['maxTemplates']) ? (int) $data['maxTemplates'] : null,
            maxStorage: isset($data['maxStorage']) ? (int) $data['maxStorage'] : null,
            maxGeneratedDeliverables: isset($data['maxGeneratedDeliverables']) ? (int) $data['maxGeneratedDeliverables'] : null,
            maxSignatures: isset($data['maxSignatures']) ? (int) $data['maxSignatures'] : null,
            maxAICredits: isset($data['maxAICredits']) ? (int) $data['maxAICredits'] : null,
            rdWatermark: isset($data['rdWatermark']) ? (bool) $data['rdWatermark'] : null,
            hasFileDownload: isset($data['hasFileDownload']) ? (bool) $data['hasFileDownload'] : null,
            hasAdvancedDateFormats: isset($data['hasAdvancedDateFormats']) ? (bool) $data['hasAdvancedDateFormats'] : null,
            hasGDrive: isset($data['hasGDrive']) ? (bool) $data['hasGDrive'] : null,
            hasSharepoint: isset($data['hasSharepoint']) ? (bool) $data['hasSharepoint'] : null,
            hasSharepointOnly: isset($data['hasSharepointOnly']) ? (bool) $data['hasSharepointOnly'] : null,
            hasTDAI: isset($data['hasTDAI']) ? (bool) $data['hasTDAI'] : null,
            hasPptx: isset($data['hasPptx']) ? (bool) $data['hasPptx'] : null,
            hasTDWriter: isset($data['hasTDWriter']) ? (bool) $data['hasTDWriter'] : null,
            hasSalesforce: isset($data['hasSalesforce']) ? (bool) $data['hasSalesforce'] : null,
            hasWrike: isset($data['hasWrike']) ? (bool) $data['hasWrike'] : null,
            hasVariableStack: isset($data['hasVariableStack']) ? (bool) $data['hasVariableStack'] : null,
            hasSubvariables: isset($data['hasSubvariables']) ? (bool) $data['hasSubvariables'] : null,
            hasZapier: isset($data['hasZapier']) ? (bool) $data['hasZapier'] : null,
            hasBYOM: isset($data['hasBYOM']) ? (bool) $data['hasBYOM'] : null,
            hasBYOVS: isset($data['hasBYOVS']) ? (bool) $data['hasBYOVS'] : null,
            hasBetaFeatures: isset($data['hasBetaFeatures']) ? (bool) $data['hasBetaFeatures'] : null,
            enableBulkSending: isset($data['enableBulkSending']) ? (bool) $data['enableBulkSending'] : null,
            createdBy: $data['createdBy'] ?? null,
        );
    }

    /**
     * Convert to array, filtering out null values
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'orgId' => $this->orgId,
            'maxUsers' => $this->maxUsers,
            'maxProjectspaces' => $this->maxProjectspaces,
            'maxTemplates' => $this->maxTemplates,
            'maxStorage' => $this->maxStorage,
            'maxGeneratedDeliverables' => $this->maxGeneratedDeliverables,
            'maxSignatures' => $this->maxSignatures,
            'maxAICredits' => $this->maxAICredits,
            'rdWatermark' => $this->rdWatermark,
            'hasFileDownload' => $this->hasFileDownload,
            'hasAdvancedDateFormats' => $this->hasAdvancedDateFormats,
            'hasGDrive' => $this->hasGDrive,
            'hasSharepoint' => $this->hasSharepoint,
            'hasSharepointOnly' => $this->hasSharepointOnly,
            'hasTDAI' => $this->hasTDAI,
            'hasPptx' => $this->hasPptx,
            'hasTDWriter' => $this->hasTDWriter,
            'hasSalesforce' => $this->hasSalesforce,
            'hasWrike' => $this->hasWrike,
            'hasVariableStack' => $this->hasVariableStack,
            'hasSubvariables' => $this->hasSubvariables,
            'hasZapier' => $this->hasZapier,
            'hasBYOM' => $this->hasBYOM,
            'hasBYOVS' => $this->hasBYOVS,
            'hasBetaFeatures' => $this->hasBetaFeatures,
            'enableBulkSending' => $this->enableBulkSending,
            'createdBy' => $this->createdBy,
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
