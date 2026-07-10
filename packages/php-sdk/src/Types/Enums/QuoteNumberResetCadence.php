<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Cadence on which the quote number sequence resets.
 */
enum QuoteNumberResetCadence: string
{
    case NEVER = 'never';
    case YEARLY = 'yearly';
    case MONTHLY = 'monthly';
}
