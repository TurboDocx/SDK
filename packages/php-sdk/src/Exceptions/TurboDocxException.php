<?php

declare(strict_types=1);

namespace TurboDocx\Exceptions;

use Exception;

/**
 * Base exception class for TurboDocx SDK
 */
class TurboDocxException extends Exception
{
    /**
     * @param string $message Error message
     * @param int|null $statusCode HTTP status code (if applicable)
     * @param string|null $errorCode Error code
     * @param \Throwable|null $previous Previous exception for chaining
     */
    public function __construct(
        string $message,
        public readonly ?int $statusCode = null,
        public readonly ?string $errorCode = null,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
