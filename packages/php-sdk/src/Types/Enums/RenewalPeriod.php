<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Renewal period values for quotes
 */
enum RenewalPeriod: string
{
    case WEEKLY = 'weekly';
    case MONTHLY = 'monthly';
    case QUARTERLY = 'quarterly';
    case ANNUALLY = 'annually';
}
