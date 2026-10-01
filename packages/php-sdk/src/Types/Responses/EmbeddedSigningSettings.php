<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * The org's embedded-signing configuration, read via
 * {@see \TurboDocx\TurboSign::getEmbeddedSigningSettings()}.
 *
 * These are the set-once, org-wide gates plus the default channel. The per-recipient identity mode
 * is chosen when you create each recipient, not here. Mirrors the TypeScript SDK's
 * `EmbeddedSigningSettings`.
 */
final class EmbeddedSigningSettings
{
    /**
     * @param bool $enabled Embedded signing (and OTP identity verification) is turned on for the org
     * @param bool $allowExternalIdv You may assert a signer's identity with your own provider
     * @param bool $allowIdentityOverride A sender may issue a link that skips identity verification
     * @param array<string> $allowedFrameAncestors Origins allowed to embed the signing page in an
     *     iframe. Empty means framing is denied everywhere.
     * @param string|null $defaultChannel The org's default OTP channel ('none' | 'email' | 'sms').
     *     While embedded signing is enabled it applies to every recipient that doesn't set one,
     *     SDK/API sends included. 'none' means verify only when a request asks for it. See
     *     $allowChannelOverride for whether you may pick a different one.
     * @param bool|null $allowChannelOverride Whether a request may give a recipient a channel other
     *     than $defaultChannel. false means the org locked the method: an explicit different channel
     *     is rejected with `OtpOverrideNotAllowed`, so omit it to take the default. Always true for a
     *     'none' default or when embedded signing is off. Null when the API did not report it.
     */
    public function __construct(
        public bool $enabled,
        public bool $allowExternalIdv,
        public bool $allowIdentityOverride,
        public array $allowedFrameAncestors,
        public ?string $defaultChannel = null,
        public ?bool $allowChannelOverride = null,
    ) {}

    /**
     * Create from array.
     *
     * Casts the gates explicitly: the backend's MySQL tinyint columns can arrive as int 0/1, which
     * under strict_types would TypeError against the promoted `bool` params.
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        /** @var array<string> $frameAncestors */
        $frameAncestors = is_array($data['allowedFrameAncestors'] ?? null) ? $data['allowedFrameAncestors'] : [];

        return new self(
            enabled: (bool) ($data['enabled'] ?? false),
            allowExternalIdv: (bool) ($data['allowExternalIdv'] ?? false),
            allowIdentityOverride: (bool) ($data['allowIdentityOverride'] ?? false),
            allowedFrameAncestors: array_values(array_map('strval', $frameAncestors)),
            defaultChannel: isset($data['defaultChannel']) ? (string) $data['defaultChannel'] : null,
            allowChannelOverride: isset($data['allowChannelOverride']) ? (bool) $data['allowChannelOverride'] : null,
        );
    }
}
