<?php

declare(strict_types=1);

namespace TurboDocx\Exceptions;

/**
 * Exception thrown when request validation fails (HTTP 400)
 */
class ValidationException extends TurboDocxException
{
    public function __construct(string $message, ?string $errorCode = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, statusCode: 400, errorCode: $errorCode ?? 'VALIDATION_ERROR', previous: $previous);
    }
}
