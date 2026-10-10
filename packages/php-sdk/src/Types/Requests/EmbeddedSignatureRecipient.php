<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

/**
 * One signer in a {@see CreateEmbeddedSignatureRequest}. Mirrors the TypeScript SDK's
 * `EmbeddedSignatureRecipient`.
 */
final class EmbeddedSignatureRecipient
{
    /**
     * @param string $name Recipient's full name
     * @param string $email Recipient's email address
     * @param string|null $phone E.164 phone number (used when auth uses SMS OTP without a shorthand
     *     phone, or for the record)
     * @param int|null $signingOrder Defaults to the recipient's index + 1 (sequential)
     * @param EmbeddedRecipientAuth|null $auth Identity-check shorthand
     * @param EmbeddedRecipientFields|null $fields Field-placement shorthand
     * @param string|null $role The template signer role this recipient fills, when sending a
     *     templateId set up with signer roles. Its saved fields are used, so `fields` can be
     *     omitted. Pass every role: a role left out falls back to the template's saved signer, who
     *     gets no embed URL from this call.
     */
    public function __construct(
        public string $name,
        public string $email,
        public ?string $phone = null,
        public ?int $signingOrder = null,
        public ?EmbeddedRecipientAuth $auth = null,
        public ?EmbeddedRecipientFields $fields = null,
        public ?string $role = null,
    ) {}
}
