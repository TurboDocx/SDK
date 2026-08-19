<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * How a dependent field's controlling checkbox is tested for conditional (IF/THEN) logic.
 */
enum ConditionalOperator: string
{
    /** The condition is met while the controlling checkbox is checked. */
    case IS_CHECKED = 'is_checked';
    /** The condition is met while the controlling checkbox is unchecked. */
    case IS_NOT_CHECKED = 'is_not_checked';
}
