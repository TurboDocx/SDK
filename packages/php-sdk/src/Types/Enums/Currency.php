<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Supported currency values
 */
enum Currency: string
{
    case USD = 'USD';
    case EUR = 'EUR';
    case GBP = 'GBP';
    case CAD = 'CAD';
    case AUD = 'AUD';
    case INR = 'INR';
}
