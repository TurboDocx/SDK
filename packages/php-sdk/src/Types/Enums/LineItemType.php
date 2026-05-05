<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Line item type values
 */
enum LineItemType: string
{
    case PRODUCT = 'product';
    case BUNDLE = 'bundle';
}
