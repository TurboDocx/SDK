<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

use TurboDocx\Types\IdentityAssertion;

/**
 * Request a single-use embedded signing URL for one recipient.
 *
 * Provide exactly one selector: `recipientId` OR `externalId`. Mirrors the TypeScript SDK's
 * `CreateSigningUrlRequest`.
 */
final class CreateSigningUrlRequest
{
    /**
     * @param string|null $recipientId Select the recipient by TurboDocx recipient id...
     * @param string|null $externalId ...or by the externalId you set when creating the recipient.
     * @param IdentityAssertion|null $identityAssertion Required only when the recipient's mode is
     *     external_idv.
     * @param string|null $returnUrl Where TurboSign returns the signer after completion (https only).
     */
    public function __construct(
        public ?string $recipientId = null,
        public ?string $externalId = null,
        public ?IdentityAssertion $identityAssertion = null,
        public ?string $returnUrl = null,
    ) {}

    /**
     * Build from a plain associative array (ergonomic array|DTO call sites).
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $assertion = $data['identityAssertion'] ?? null;
        if (is_array($assertion)) {
            $assertion = new IdentityAssertion(
                provider: (string) ($assertion['provider'] ?? ''),
                verificationId: (string) ($assertion['verificationId'] ?? ''),
                verifiedAt: (string) ($assertion['verifiedAt'] ?? ''),
                subjectEmail: (string) ($assertion['subjectEmail'] ?? ''),
            );
        }

        return new self(
            recipientId: isset($data['recipientId']) ? (string) $data['recipientId'] : null,
            externalId: isset($data['externalId']) ? (string) $data['externalId'] : null,
            identityAssertion: $assertion instanceof IdentityAssertion ? $assertion : null,
            returnUrl: isset($data['returnUrl']) ? (string) $data['returnUrl'] : null,
        );
    }

    /**
     * Convert to request body, emitting only the keys that are set.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];
        if ($this->recipientId !== null) {
            $data['recipientId'] = $this->recipientId;
        }
        if ($this->externalId !== null) {
            $data['externalId'] = $this->externalId;
        }
        if ($this->identityAssertion !== null) {
            $data['identityAssertion'] = $this->identityAssertion->toArray();
        }
        // Treat an empty-string returnUrl as ABSENT (omit it from the body), matching js-sdk/Go/Python.
        if ($this->returnUrl !== null && $this->returnUrl !== '') {
            $data['returnUrl'] = $this->returnUrl;
        }
        return $data;
    }
}
