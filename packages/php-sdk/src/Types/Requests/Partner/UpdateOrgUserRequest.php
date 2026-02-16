<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Types\Enums\OrgUserRole;

/**
 * Request for updating an organization user's role
 */
final class UpdateOrgUserRequest
{
    /**
     * @param OrgUserRole $role New role for the user
     */
    public function __construct(
        public readonly OrgUserRole $role,
    ) {}

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return ['role' => $this->role->value];
    }
}
