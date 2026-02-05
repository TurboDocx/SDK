<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Organization user roles
 */
enum OrgUserRole: string
{
    case ADMIN = 'admin';
    case CONTRIBUTOR = 'contributor';
    case USER = 'user';
    case VIEWER = 'viewer';
}
