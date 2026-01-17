<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Template anchor field placement options
 */
enum FieldPlacement: string
{
    case REPLACE = 'replace';
    case BEFORE = 'before';
    case AFTER = 'after';
    case ABOVE = 'above';
    case BELOW = 'below';
}
