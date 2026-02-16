<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Types\Partner\PartnerPermissions;

/**
 * Request for updating a partner user's role and permissions
 */
final class UpdatePartnerUserRequest
{
    /**
     * @param string|null $role New role
     * @param PartnerPermissions|null $permissions New permissions
     */
    public function __construct(
        public readonly ?string $role = null,
        public readonly ?PartnerPermissions $permissions = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->role !== null) {
            $data['role'] = $this->role;
        }
        if ($this->permissions !== null) {
            $data['permissions'] = $this->permissions->toArray();
        }

        return $data;
    }
}
