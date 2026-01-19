<?php

declare(strict_types=1);

namespace TurboDocx\Exceptions;

/**
 * Exception thrown when authentication fails (HTTP 401)
 */
class AuthenticationException extends TurboDocxException
{
    public function __construct(string $message = 'Authentication failed')
    {
        parent::__construct($message, statusCode: 401, errorCode: 'AUTHENTICATION_ERROR');
    }
}
