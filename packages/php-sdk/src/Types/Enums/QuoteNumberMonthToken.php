<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Month token included in a generated quote number.
 */
enum QuoteNumberMonthToken: string
{
    case OFF = 'off';
    case TWO = 'two';
}
