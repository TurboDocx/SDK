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
     *     iframe (empty = no restriction configured)
     * @param string|null $defaultChannel Default OTP channel ('none' | 'email' | 'sms') applied to
     *     recipients that do not specify one, on the interactive (UI) create path only
     */
    public function __construct(
        public bool $enabled,
        public bool $allowExternalIdv,
        public bool $allowIdentityOverride,
        public array $allowedFrameAncestors,
        public ?string $defaultChannel = null,
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
        );
    }
}
