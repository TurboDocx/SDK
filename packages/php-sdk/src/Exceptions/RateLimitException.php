<?php

declare(strict_types=1);

namespace TurboDocx\Exceptions;

/**
 * Exception thrown when rate limit is exceeded (HTTP 429)
 */
class RateLimitException extends TurboDocxException
{
    public function __construct(string $message = 'Rate limit exceeded')
    {
        parent::__construct($message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}
