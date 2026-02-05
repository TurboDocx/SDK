<?php

declare(strict_types=1);

namespace TurboDocx\Types\Partner;

/**
 * Audit log entry domain type
 */
final class AuditLogEntry implements \JsonSerializable
{
    /**
     * @param array<string, mixed>|null $details
     */
    public function __construct(
        public readonly string $id,
        public readonly string $partnerId,
        public readonly ?string $partnerAPIKeyId = null,
        public readonly ?string $action = null,
        public readonly ?string $resourceType = null,
        public readonly ?string $resourceId = null,
        public readonly ?array $details = null,
        public readonly ?bool $success = null,
        public readonly ?string $ipAddress = null,
        public readonly ?string $userAgent = null,
        public readonly ?string $createdOn = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            partnerId: $data['partnerId'] ?? '',
            partnerAPIKeyId: $data['partnerAPIKeyId'] ?? null,
            action: $data['action'] ?? null,
            resourceType: $data['resourceType'] ?? null,
            resourceId: $data['resourceId'] ?? null,
            details: $data['details'] ?? null,
            success: isset($data['success']) ? (bool) $data['success'] : null,
            ipAddress: $data['ipAddress'] ?? null,
            userAgent: $data['userAgent'] ?? null,
            createdOn: $data['createdOn'] ?? null,
        );
    }

    /**
     * Convert to array, filtering out null values
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'id' => $this->id,
            'partnerId' => $this->partnerId,
            'partnerAPIKeyId' => $this->partnerAPIKeyId,
            'action' => $this->action,
            'resourceType' => $this->resourceType,
            'resourceId' => $this->resourceId,
            'details' => $this->details,
            'success' => $this->success,
            'ipAddress' => $this->ipAddress,
            'userAgent' => $this->userAgent,
            'createdOn' => $this->createdOn,
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
