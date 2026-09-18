<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

/**
 * Per-recipient identity check for embedded signing, in ergonomic shorthand.
 *
 * Expands to the recipient's {@see \TurboDocx\Types\IdentityVerification}. Leave both keys at their
 * defaults for no identity verification. Mirrors the TypeScript SDK's `EmbeddedRecipientAuth`.
 */
final class EmbeddedRecipientAuth
{
    /**
     * @param bool $emailOtp Require an email OTP before signing. Maps to
     *     identityVerification { mode:'otp', channel:'email' }.
     * @param string|null $smsPhoneNumber Require an SMS OTP to this number. Maps to
     *     identityVerification { mode:'otp', channel:'sms' } and sets the recipient's phone.
     */
    public function __construct(
        public bool $emailOtp = false,
        public ?string $smsPhoneNumber = null,
    ) {}
}
