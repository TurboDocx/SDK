<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\Enums\OrgUserRole;

/**
 * Request for adding a user to an organization
 */
final class AddOrgUserRequest
{
    /**
     * @param string $email User email address
     * @param OrgUserRole $role User role in organization
     */
    public function __construct(
        public readonly string $email,
        public readonly OrgUserRole $role,
    ) {
        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException("Invalid email address: {$this->email}");
        }
    }

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'role' => $this->role->value,
        ];
    }
}
