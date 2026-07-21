<?php

declare(strict_types=1);

namespace TurboDocx\Exceptions;

/**
 * Exception thrown when a request conflicts with the current server state,
 * e.g. attempting to create a resource whose unique name is already taken
 * (HTTP 409).
 */
class ConflictException extends TurboDocxException
{
    public function __construct(string $message = 'Conflict with existing resource', ?string $errorCode = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, statusCode: 409, errorCode: $errorCode ?? 'CONFLICT', previous: $previous);
    }
}
