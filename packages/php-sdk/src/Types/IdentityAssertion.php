<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * An identity assertion from your own provider, passed when requesting an external_idv signing URL.
 *
 * Mirrors the TypeScript SDK's `IdentityAssertion`. The four leading fields are required; the rest
 * are optional context recorded on the certificate / audit trail and are omitted from the request
 * when left null.
 */
final class IdentityAssertion
{
    /**
     * @param string $provider Must match the recipient's configured provider
     * @param string $verificationId Your provider's unique id for this verification (replay detection)
     * @param string $verifiedAt When your provider verified the signer (ISO 8601)
     * @param string $subjectEmail The email your provider verified (must match the recipient's email)
     * @param string|null $method How your provider verified the signer: 'id_document',
     *     'id_document_liveness', 'kba', 'database', 'sso' or 'other' (describe 'other' in $methodDetail)
     * @param string|null $methodDetail Free-text description of the method; required when $method is 'other'
     * @param string|null $assuranceLevel The level your provider attests to, e.g. 'ial2_aal2' (NIST
     *     800-63), 'eidas_substantial' or 'eidas_high'
     * @param string|null $verifiedName The signer's legal name as verified by your provider
     * @param string|null $evidenceUrl An https link to your provider's verification record
     * @param bool|null $overrideEmailMatching true skips the check that $subjectEmail equals the
     *     recipient's email. Set it only when you have confirmed the verified identity is this signer
     *     although the emails differ; the override is recorded on the audit trail.
     */
    public function __construct(
        public string $provider,
        public string $verificationId,
        public string $verifiedAt,
        public string $subjectEmail,
        public ?string $method = null,
        public ?string $methodDetail = null,
        public ?string $assuranceLevel = null,
        public ?string $verifiedName = null,
        public ?string $evidenceUrl = null,
        public ?bool $overrideEmailMatching = null,
    ) {}

    /**
     * Build from a plain associative array (camelCase keys, as the API takes them).
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $optionalString = static fn(string $key): ?string => isset($data[$key]) ? (string) $data[$key] : null;

        return new self(
            provider: (string) ($data['provider'] ?? ''),
            verificationId: (string) ($data['verificationId'] ?? ''),
            verifiedAt: (string) ($data['verifiedAt'] ?? ''),
            subjectEmail: (string) ($data['subjectEmail'] ?? ''),
            method: $optionalString('method'),
            methodDetail: $optionalString('methodDetail'),
            assuranceLevel: $optionalString('assuranceLevel'),
            verifiedName: $optionalString('verifiedName'),
            evidenceUrl: $optionalString('evidenceUrl'),
            overrideEmailMatching: isset($data['overrideEmailMatching']) ? (bool) $data['overrideEmailMatching'] : null,
        );
    }

    /**
     * Convert to array for JSON serialization. Optional fields are included only when set.
     *
     * @return array<string, string|bool>
     */
    public function toArray(): array
    {
        $data = [
            'provider' => $this->provider,
            'verificationId' => $this->verificationId,
            'verifiedAt' => $this->verifiedAt,
            'subjectEmail' => $this->subjectEmail,
        ];
        $optional = [
            'method' => $this->method,
            'methodDetail' => $this->methodDetail,
            'assuranceLevel' => $this->assuranceLevel,
            'verifiedName' => $this->verifiedName,
            'evidenceUrl' => $this->evidenceUrl,
            'overrideEmailMatching' => $this->overrideEmailMatching,
        ];
        foreach ($optional as $key => $value) {
            if ($value !== null) {
                $data[$key] = $value;
            }
        }
        return $data;
    }
}
