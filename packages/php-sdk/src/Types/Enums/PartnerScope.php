<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Partner API key scopes
 */
enum PartnerScope: string
{
    // Organization CRUD
    case ORG_CREATE = 'org:create';
    case ORG_READ = 'org:read';
    case ORG_UPDATE = 'org:update';
    case ORG_DELETE = 'org:delete';

    // Entitlements
    case ENTITLEMENTS_UPDATE = 'entitlements:update';

    // Organization Users
    case ORG_USERS_CREATE = 'org-users:create';
    case ORG_USERS_READ = 'org-users:read';
    case ORG_USERS_UPDATE = 'org-users:update';
    case ORG_USERS_DELETE = 'org-users:delete';

    // Partner Users
    case PARTNER_USERS_CREATE = 'partner-users:create';
    case PARTNER_USERS_READ = 'partner-users:read';
    case PARTNER_USERS_UPDATE = 'partner-users:update';
    case PARTNER_USERS_DELETE = 'partner-users:delete';

    // Organization API Keys
    case ORG_APIKEYS_CREATE = 'org-apikeys:create';
    case ORG_APIKEYS_READ = 'org-apikeys:read';
    case ORG_APIKEYS_UPDATE = 'org-apikeys:update';
    case ORG_APIKEYS_DELETE = 'org-apikeys:delete';

    // Partner API Keys
    case PARTNER_APIKEYS_CREATE = 'partner-apikeys:create';
    case PARTNER_APIKEYS_READ = 'partner-apikeys:read';
    case PARTNER_APIKEYS_UPDATE = 'partner-apikeys:update';
    case PARTNER_APIKEYS_DELETE = 'partner-apikeys:delete';

    // Audit logs
    case AUDIT_READ = 'audit:read';

    /**
     * Get all scope values as array
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_map(fn(self $scope) => $scope->value, self::cases());
    }
}
