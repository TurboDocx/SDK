<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Discount type for line items, bundles, and pricebook product pricing
 */
enum DiscountType: string
{
    case PERCENT = 'percent';
    case AMOUNT = 'amount';
}
