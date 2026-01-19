<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\Recipient;

final class RecipientTest extends TestCase
{
    public function testCreateValidRecipient(): void
    {
        $recipient = new Recipient('John Doe', 'john@example.com', 1);

        $this->assertEquals('John Doe', $recipient->name);
        $this->assertEquals('john@example.com', $recipient->email);
        $this->assertEquals(1, $recipient->signingOrder);
    }

    public function testToArray(): void
    {
        $recipient = new Recipient('Jane Smith', 'jane@example.com', 2);
        $array = $recipient->toArray();

        $this->assertEquals([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'signingOrder' => 2,
        ], $array);
    }

    public function testInvalidEmailThrowsException(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Invalid email address: invalid-email');

        new Recipient('John Doe', 'invalid-email', 1);
    }

    public function testSigningOrderLessThanOneThrowsException(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Signing order must be >= 1');

        new Recipient('John Doe', 'john@example.com', 0);
    }

    public function testNegativeSigningOrderThrowsException(): void
    {
        $this->expectException(ValidationException::class);

        new Recipient('John Doe', 'john@example.com', -1);
    }
}
