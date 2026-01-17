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
     */
    public function __construct(
        string $message,
        public readonly ?int $statusCode = null,
        public readonly ?string $errorCode = null,
    ) {
        parent::__construct($message);
    }
}
