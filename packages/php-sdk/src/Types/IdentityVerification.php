<?php

declare(strict_types=1);

namespace TurboDocx\Types;

use TurboDocx\Exceptions\ValidationException;

/**
 * How an embedded recipient's identity is verified before they can sign.
 *
 * Mirrors the discriminated union in the TypeScript SDK (`IdentityVerification`). PHP has no
 * discriminated unions, so this is a single value object keyed on {@see IdentityVerification::$mode}
 * with named constructors that only accept the fields valid for that mode:
 * - {@see IdentityVerification::otp()} — TurboSign emails or texts a one-time passcode (SMS requires
 *   `phone` on the recipient).
 * - {@see IdentityVerification::externalIdv()} — your own identity provider (e.g. CAPA) verifies the
 *   signer; pass the assertion to {@see \TurboDocx\TurboSign::createSigningUrl()}.
 * - {@see IdentityVerification::override()} — skip identity verification entirely (development/testing;
 *   your org admin must enable it). Every such signature is marked "not identity-verified".
 */
final class IdentityVerification
{
    public const MODE_OTP = 'otp';
    public const MODE_EXTERNAL_IDV = 'external_idv';
    public const MODE_OVERRIDE = 'override';

    /**
     * @param string $mode One of MODE_OTP, MODE_EXTERNAL_IDV, MODE_OVERRIDE
     * @param string|null $channel OTP channel ('email' | 'sms'), only for MODE_OTP
     * @param string|null $provider Identity provider name, only for MODE_EXTERNAL_IDV
     * @param int|null $maxAgeMinutes Max assertion age in minutes, only for MODE_EXTERNAL_IDV
     * @param bool|null $overrideIdentityVerification Acknowledgement flag, only for MODE_OVERRIDE
     * @param string|null $reason Reason for the override, only for MODE_OVERRIDE
     */
    private function __construct(
        public readonly string $mode,
        public readonly ?string $channel = null,
        public readonly ?string $provider = null,
        public readonly ?int $maxAgeMinutes = null,
        public readonly ?bool $overrideIdentityVerification = null,
        public readonly ?string $reason = null,
    ) {}

    /**
     * Require a one-time passcode before signing.
     *
     * @param string $channel 'email' (default) or 'sms'. SMS requires the recipient to carry a phone.
     */
    public static function otp(string $channel = 'email'): self
    {
        return new self(mode: self::MODE_OTP, channel: $channel);
    }

    /**
     * Verify the signer with your own identity provider.
     *
     * @param string $provider Provider name (must match the assertion you pass at signing time)
     * @param int|null $maxAgeMinutes Reject assertions older than this
     * @throws ValidationException If provider is empty
     */
    public static function externalIdv(string $provider, ?int $maxAgeMinutes = null): self
    {
        if (trim($provider) === '') {
            throw new ValidationException('external_idv requires a non-empty provider.', 'IdvProviderRequired');
        }
        return new self(mode: self::MODE_EXTERNAL_IDV, provider: $provider, maxAgeMinutes: $maxAgeMinutes);
    }

    /**
     * Skip identity verification (development/testing). The signature is recorded as
     * not identity-verified; your org admin must have enabled overrides.
     *
     * @param string $reason Why verification is being skipped (recorded on the certificate)
     * @throws ValidationException If reason is empty
     */
    public static function override(string $reason): self
    {
        if (trim($reason) === '') {
            throw new ValidationException('override requires a non-empty reason.', 'OverrideNotAcknowledged');
        }
        return new self(mode: self::MODE_OVERRIDE, overrideIdentityVerification: true, reason: $reason);
    }

    /**
     * Convert to array for JSON serialization, emitting only the keys valid for this mode.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return match ($this->mode) {
            self::MODE_OTP => array_filter(
                ['mode' => $this->mode, 'channel' => $this->channel],
                static fn($v) => $v !== null
            ),
            self::MODE_EXTERNAL_IDV => array_filter(
                ['mode' => $this->mode, 'provider' => $this->provider, 'maxAgeMinutes' => $this->maxAgeMinutes],
                static fn($v) => $v !== null
            ),
            self::MODE_OVERRIDE => [
                'mode' => $this->mode,
                'overrideIdentityVerification' => true,
                'reason' => $this->reason,
            ],
            default => ['mode' => $this->mode],
        };
    }
}
