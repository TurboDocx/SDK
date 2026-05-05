<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Quote status values
 */
enum QuoteStatus: string
{
    case DRAFT = 'draft';
    case SENT = 'sent';
    case ACCEPTED = 'accepted';
    case DECLINED = 'declined';
    case VOIDED = 'voided';
}
