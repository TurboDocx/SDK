<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * The single-use embedded signing URL and its metadata. Mirrors the TypeScript SDK's
 * `CreateSigningUrlResponse`.
 */
final class CreateSigningUrlResponse
{
    /**
     * @param string $url The URL to open (new tab / redirect) or embed for the signer
     * @param string|null $expiresAt When the URL stops working (ISO 8601). Null for
     *     `otp`/no-verification recipients, whose link follows the document's signing window.
     * @param string $recipientId TurboDocx recipient id
     * @param string|null $externalId The externalId you set when creating the recipient, if any
     * @param string|null $identityVerificationMode 'otp' | 'external_idv' | 'override' | null
     * @param array<string> $pendingChecks Passcode steps the signer must clear ('email_otp' |
     *     'sms_otp'). Non-empty only for `otp`.
     */
    public function __construct(
        public string $url,
        public ?string $expiresAt,
        public string $recipientId,
        public ?string $externalId,
        public ?string $identityVerificationMode,
        public array $pendingChecks,
    ) {}

    /**
     * Create from array
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        /** @var array<string> $pendingChecks */
        $pendingChecks = is_array($data['pendingChecks'] ?? null) ? $data['pendingChecks'] : [];

        return new self(
            url: (string) ($data['url'] ?? ''),
            expiresAt: isset($data['expiresAt']) ? (string) $data['expiresAt'] : null,
            recipientId: (string) ($data['recipientId'] ?? ''),
            externalId: isset($data['externalId']) ? (string) $data['externalId'] : null,
            identityVerificationMode: isset($data['identityVerificationMode'])
                ? (string) $data['identityVerificationMode']
                : null,
            pendingChecks: array_values(array_map('strval', $pendingChecks)),
        );
    }
}
