<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\Partner\PartnerPermissions;

/**
 * Request for adding a user to the partner portal
 */
final class AddPartnerUserRequest
{
    /**
     * @param string $email User email address
     * @param string $role User role (admin, member, viewer)
     * @param PartnerPermissions $permissions User permissions
     */
    public function __construct(
        public readonly string $email,
        public readonly string $role,
        public readonly PartnerPermissions $permissions,
    ) {
        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException("Invalid email address: {$this->email}");
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'role' => $this->role,
            'permissions' => $this->permissions->toArray(),
        ];
    }
}
