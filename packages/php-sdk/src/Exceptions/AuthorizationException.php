<?php

declare(strict_types=1);

namespace TurboDocx\Exceptions;

/**
 * Exception thrown when the caller is authenticated but lacks the
 * permissions required by the route (HTTP 403).
 */
class AuthorizationException extends TurboDocxException
{
    public function __construct(string $message = 'Forbidden: API key lacks required permissions', ?string $errorCode = null, ?\Throwable $previous = null)
    {
        parent::__construct($message, statusCode: 403, errorCode: $errorCode ?? 'AUTHORIZATION_ERROR', previous: $previous);
    }
}
