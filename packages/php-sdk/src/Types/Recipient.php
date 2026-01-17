<?php

declare(strict_types=1);

namespace TurboDocx\Types;

use TurboDocx\Exceptions\ValidationException;

/**
 * Recipient configuration for signature requests
 */
final class Recipient
{
    /**
     * @param string $name Recipient's full name
     * @param string $email Recipient's email address
     * @param int $signingOrder Signing order (1-indexed, 1 = first to sign)
     * @throws ValidationException If email is invalid or signingOrder < 1
     */
    public function __construct(
        public string $name,
        public string $email,
        public int $signingOrder
    ) {
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException("Invalid email address: {$email}");
        }

        // Validate signing order
        if ($signingOrder < 1) {
            throw new ValidationException('Signing order must be >= 1');
        }
    }

    /**
     * Convert to array for JSON serialization
     *
     * @return array{name: string, email: string, signingOrder: int}
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'signingOrder' => $this->signingOrder,
        ];
    }
}
