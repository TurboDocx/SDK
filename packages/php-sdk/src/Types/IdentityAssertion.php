<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * An identity assertion from your own provider, passed when requesting an external_idv signing URL.
 *
 * Mirrors the TypeScript SDK's `IdentityAssertion`.
 */
final class IdentityAssertion
{
    /**
     * @param string $provider Must match the recipient's configured provider
     * @param string $verificationId Your provider's unique id for this verification (replay detection)
     * @param string $verifiedAt When your provider verified the signer (ISO 8601)
     * @param string $subjectEmail The email your provider verified (must match the recipient's email)
     */
    public function __construct(
        public string $provider,
        public string $verificationId,
        public string $verifiedAt,
        public string $subjectEmail,
    ) {}

    /**
     * Convert to array for JSON serialization
     *
     * @return array{provider: string, verificationId: string, verifiedAt: string, subjectEmail: string}
     */
    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'verificationId' => $this->verificationId,
            'verifiedAt' => $this->verifiedAt,
            'subjectEmail' => $this->subjectEmail,
        ];
    }
}
