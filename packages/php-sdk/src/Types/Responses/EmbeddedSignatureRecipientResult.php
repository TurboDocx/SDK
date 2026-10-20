<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * One resolved signer in a {@see CreateEmbeddedSignatureResponse}. Mirrors the TypeScript SDK's
 * `EmbeddedSignatureRecipientResult`.
 */
final class EmbeddedSignatureRecipientResult
{
    public const STATUS_READY = 'ready';
    public const STATUS_PENDING = 'pending';
    public const STATUS_COMPLETED = 'completed';

    /**
     * @param string $recipientId TurboDocx recipient id
     * @param string $name Recipient's full name
     * @param string $email Recipient's email address
     * @param string|null $embedUrl The embeddable signing URL — present only when it is this
     *     recipient's turn (`status: 'ready'`). Null for 'pending' or 'completed'.
     * @param string $status 'ready' | 'pending' | 'completed'
     * @param string|null $identityVerificationMode 'otp' | 'external_idv' | 'override' | null. For a
     *     'ready' signer, the mode the backend resolved for the URL; for 'pending' / 'completed' no
     *     URL was minted, so it is the mode you requested via `auth` (null when you set none, even
     *     if the org's default channel applies). createSigningUrl() reports the effective mode.
     *     From createEmbeddedSignature() it is only ever 'otp' or null.
     */
    public function __construct(
        public string $recipientId,
        public string $name,
        public string $email,
        public ?string $embedUrl,
        public string $status,
        public ?string $identityVerificationMode,
    ) {}
}
