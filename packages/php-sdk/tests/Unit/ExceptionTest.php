<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\NetworkException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\Exceptions\RateLimitException;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Exceptions\ValidationException;

final class ExceptionTest extends TestCase
{
    public function testTurboDocxException(): void
    {
        $exception = new TurboDocxException('Test message', 500, 'TEST_ERROR');

        $this->assertEquals('Test message', $exception->getMessage());
        $this->assertEquals(500, $exception->statusCode);
        $this->assertEquals('TEST_ERROR', $exception->errorCode);
    }

    public function testAuthenticationException(): void
    {
        $exception = new AuthenticationException('Custom auth message');

        $this->assertEquals('Custom auth message', $exception->getMessage());
        $this->assertEquals(401, $exception->statusCode);
        $this->assertEquals('AUTHENTICATION_ERROR', $exception->errorCode);
    }

    public function testAuthenticationExceptionDefaultMessage(): void
    {
        $exception = new AuthenticationException();

        $this->assertEquals('Authentication failed', $exception->getMessage());
    }

    public function testValidationException(): void
    {
        $exception = new ValidationException('Invalid data');

        $this->assertEquals('Invalid data', $exception->getMessage());
        $this->assertEquals(400, $exception->statusCode);
        $this->assertEquals('VALIDATION_ERROR', $exception->errorCode);
    }

    public function testNotFoundException(): void
    {
        $exception = new NotFoundException('Custom not found message');

        $this->assertEquals('Custom not found message', $exception->getMessage());
        $this->assertEquals(404, $exception->statusCode);
        $this->assertEquals('NOT_FOUND', $exception->errorCode);
    }

    public function testNotFoundExceptionDefaultMessage(): void
    {
        $exception = new NotFoundException();

        $this->assertEquals('Resource not found', $exception->getMessage());
    }

    public function testRateLimitException(): void
    {
        $exception = new RateLimitException('Custom rate limit message');

        $this->assertEquals('Custom rate limit message', $exception->getMessage());
        $this->assertEquals(429, $exception->statusCode);
        $this->assertEquals('RATE_LIMIT_EXCEEDED', $exception->errorCode);
    }

    public function testRateLimitExceptionDefaultMessage(): void
    {
        $exception = new RateLimitException();

        $this->assertEquals('Rate limit exceeded', $exception->getMessage());
    }

    public function testNetworkException(): void
    {
        $exception = new NetworkException('Connection failed');

        $this->assertEquals('Connection failed', $exception->getMessage());
        $this->assertNull($exception->statusCode);
        $this->assertEquals('NETWORK_ERROR', $exception->errorCode);
    }
}
