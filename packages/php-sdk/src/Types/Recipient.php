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
     * @param string|null $phone E.164 phone number (e.g. +13055551234). Required when identity
     *     verification uses SMS OTP.
     * @param string|null $externalId Your own identifier for this signer (unique within the
     *     document). Lets you request a signing URL by your key instead of storing TurboDocx's id.
     * @param IdentityVerification|null $identityVerification Identity verification for embedded
     *     signing. Omit for the default email-invite flow.
     * @throws ValidationException If email is invalid or signingOrder < 1
     */
    public function __construct(
        public string $name,
        public string $email,
        public int $signingOrder,
        public ?string $phone = null,
        public ?string $externalId = null,
        public ?IdentityVerification $identityVerification = null,
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
     * Convert to array for JSON serialization.
     *
     * Optional embedded-signing fields (phone, externalId, identityVerification) are emitted only
     * when set, so the default email-invite recipient keeps its original three-key shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'email' => $this->email,
            'signingOrder' => $this->signingOrder,
        ];

        if ($this->phone !== null) {
            $data['phone'] = $this->phone;
        }
        if ($this->externalId !== null) {
            $data['externalId'] = $this->externalId;
        }
        if ($this->identityVerification !== null) {
            $data['identityVerification'] = $this->identityVerification->toArray();
        }

        return $data;
    }
}
