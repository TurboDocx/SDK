<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Recipient status values
 */
enum RecipientStatus: string
{
    case PENDING = 'pending';
    case COMPLETED = 'completed';
    case DECLINED = 'declined';
}
