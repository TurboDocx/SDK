<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * What happens to a dependent field until its condition is met.
 */
enum ConditionalAction: string
{
    /** The field is hidden until the condition is met, then revealed. */
    case SHOW = 'show';
    /** The field is visible but read-only until the condition is met, then editable. */
    case UNLOCK = 'unlock';
}
