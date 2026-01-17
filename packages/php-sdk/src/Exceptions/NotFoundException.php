<?php

declare(strict_types=1);

namespace TurboDocx\Exceptions;

/**
 * Exception thrown when resource is not found (HTTP 404)
 */
class NotFoundException extends TurboDocxException
{
    public function __construct(string $message = 'Resource not found')
    {
        parent::__construct($message, 404, 'NOT_FOUND');
    }
}
