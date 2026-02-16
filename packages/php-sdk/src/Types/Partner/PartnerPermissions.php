<?php

declare(strict_types=1);

namespace TurboDocx\Types\Partner;

/**
 * Partner user permissions
 */
final class PartnerPermissions implements \JsonSerializable
{
    public function __construct(
        public readonly bool $canManageOrgs = false,
        public readonly bool $canManageOrgUsers = false,
        public readonly bool $canManagePartnerUsers = false,
        public readonly bool $canManageOrgAPIKeys = false,
        public readonly bool $canManagePartnerAPIKeys = false,
        public readonly bool $canUpdateEntitlements = false,
        public readonly bool $canViewAuditLogs = false,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            canManageOrgs: (bool) ($data['canManageOrgs'] ?? false),
            canManageOrgUsers: (bool) ($data['canManageOrgUsers'] ?? false),
            canManagePartnerUsers: (bool) ($data['canManagePartnerUsers'] ?? false),
            canManageOrgAPIKeys: (bool) ($data['canManageOrgAPIKeys'] ?? false),
            canManagePartnerAPIKeys: (bool) ($data['canManagePartnerAPIKeys'] ?? false),
            canUpdateEntitlements: (bool) ($data['canUpdateEntitlements'] ?? false),
            canViewAuditLogs: (bool) ($data['canViewAuditLogs'] ?? false),
        );
    }

    /**
     * @return array<string, bool>
     */
    public function toArray(): array
    {
        return [
            'canManageOrgs' => $this->canManageOrgs,
            'canManageOrgUsers' => $this->canManageOrgUsers,
            'canManagePartnerUsers' => $this->canManagePartnerUsers,
            'canManageOrgAPIKeys' => $this->canManageOrgAPIKeys,
            'canManagePartnerAPIKeys' => $this->canManagePartnerAPIKeys,
            'canUpdateEntitlements' => $this->canUpdateEntitlements,
            'canViewAuditLogs' => $this->canViewAuditLogs,
        ];
    }

    /**
     * @return array<string, bool>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
