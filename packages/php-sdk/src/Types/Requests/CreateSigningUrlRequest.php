<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\IdentityAssertion;
use TurboDocx\Types\PageNavigation;

/**
 * Request an embedded signing URL for one recipient.
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
     * @param PageNavigation|null $pageNavigation How the embedded signing page shows its page
     *     navigation when loaded in an iframe. Applies to this issuance only: a later call without
     *     it (or with `PageNavigation::AUTO`) resets to auto.
     */
    public function __construct(
        public ?string $recipientId = null,
        public ?string $externalId = null,
        public ?IdentityAssertion $identityAssertion = null,
        public ?string $returnUrl = null,
        public ?PageNavigation $pageNavigation = null,
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
            /** @var array<string, mixed> $assertion */
            $assertion = IdentityAssertion::fromArray($assertion);
        }

        return new self(
            recipientId: isset($data['recipientId']) ? (string) $data['recipientId'] : null,
            externalId: isset($data['externalId']) ? (string) $data['externalId'] : null,
            identityAssertion: $assertion instanceof IdentityAssertion ? $assertion : null,
            returnUrl: isset($data['returnUrl']) ? (string) $data['returnUrl'] : null,
            pageNavigation: self::pageNavigationFrom($data['pageNavigation'] ?? null),
        );
    }

    /**
     * Accept a PageNavigation case or its string value ('auto' | 'collapsed' | 'hidden').
     *
     * @throws ValidationException For any other value
     */
    private static function pageNavigationFrom(mixed $value): ?PageNavigation
    {
        if ($value === null || $value instanceof PageNavigation) {
            return $value;
        }
        $mode = is_string($value) ? PageNavigation::tryFrom($value) : null;
        if ($mode === null) {
            throw new ValidationException(
                'pageNavigation must be one of auto, collapsed, hidden.',
                'InvalidPageNavigation'
            );
        }
        return $mode;
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
        if ($this->pageNavigation !== null) {
            $data['pageNavigation'] = $this->pageNavigation->value;
        }
        return $data;
    }
}
