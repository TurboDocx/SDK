<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Document status values
 */
enum DocumentStatus: string
{
    case DRAFT = 'draft';
    case SETUP_COMPLETE = 'setup_complete';
    case REVIEW_READY = 'review_ready';
    case UNDER_REVIEW = 'under_review';
    case COMPLETED = 'completed';
    case VOIDED = 'voided';
}
