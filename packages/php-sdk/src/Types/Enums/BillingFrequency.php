<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Billing frequency values for line items and products
 */
enum BillingFrequency: string
{
    case MONTHLY = 'monthly';
    case QUARTERLY = 'quarterly';
    case ANNUAL = 'annual';
    case ONE_TIME = 'one-time';
}
