<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Year token width included in a generated quote number.
 */
enum QuoteNumberYearToken: string
{
    case NONE = 'none';
    case TWO = 'two';
    case FOUR = 'four';
}
