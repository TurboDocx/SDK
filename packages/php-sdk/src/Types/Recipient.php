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
     * @param int|null $signingOrder Signing order (1-indexed, 1 = first to sign). Required, except
     *     for a recipient with a $role: a template's roles sign in the order saved on the template,
     *     and recipients without a role sign after them.
     * @param string|null $phone E.164 phone number (e.g. +13055551234). Required when identity
     *     verification uses SMS OTP.
     * @param string|null $externalId Your own identifier for this signer (unique within the
     *     document). Lets you request a signing URL by your key instead of storing TurboDocx's id.
     *     A blank or whitespace-only value counts as absent (stored as null, so it never collides
     *     with another blank and cannot be used to look the recipient up).
     * @param IdentityVerification|null $identityVerification Identity verification for embedded
     *     signing. Omit it to take the org's default channel (EmbeddedSigningSettings::$defaultChannel):
     *     no verification when that is 'none', otherwise a passcode on the default channel.
     *     external_idv and override recipients sign only through a single-use createSigningUrl()
     *     link and are never sent signing, reminder or resend emails.
     * @param string|null $role The template signer role this recipient fills (e.g. 'client'), when
     *     sending a templateId whose signers and fields were set up in TurboDocx. The recipient gets
     *     every field saved for that role. A role you leave out uses the signer saved on the
     *     template, if it has one. List a template's roles with
     *     {@see \TurboDocx\TurboSign::getTemplateSignatureSetup()}.
     * @throws ValidationException If email is invalid, signingOrder < 1, or neither signingOrder
     *     nor role is given
     */
    public function __construct(
        public string $name,
        public string $email,
        public ?int $signingOrder = null,
        public ?string $phone = null,
        public ?string $externalId = null,
        public ?IdentityVerification $identityVerification = null,
        public ?string $role = null,
    ) {
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException("Invalid email address: {$email}");
        }

        // Validate signing order (only a recipient with a role may leave it out)
        if ($signingOrder === null && $role === null) {
            throw new ValidationException('Signing order is required unless the recipient has a role');
        }
        if ($signingOrder !== null && $signingOrder < 1) {
            throw new ValidationException('Signing order must be >= 1');
        }
    }

    /**
     * Convert to array for JSON serialization.
     *
     * Optional fields (signingOrder, role, phone, externalId, identityVerification) are emitted only
     * when set, so the default email-invite recipient keeps its original three-key shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'email' => $this->email,
        ];

        if ($this->signingOrder !== null) {
            $data['signingOrder'] = $this->signingOrder;
        }
        if ($this->role !== null) {
            $data['role'] = $this->role;
        }

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
