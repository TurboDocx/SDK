<?php

declare(strict_types=1);

namespace TurboDocx\Exceptions;

/**
 * Exception thrown when network request fails
 */
class NetworkException extends TurboDocxException
{
    public function __construct(string $message, ?\Throwable $previous = null)
    {
        parent::__construct($message, statusCode: null, errorCode: 'NETWORK_ERROR', previous: $previous);
    }
}
