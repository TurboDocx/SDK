<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Partner user roles
 */
enum PartnerUserRole: string
{
    case ADMIN = 'admin';
    case MEMBER = 'member';
    case VIEWER = 'viewer';
}
