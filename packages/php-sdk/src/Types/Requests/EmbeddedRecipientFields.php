<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

/**
 * Shorthand field placement by text anchor for embedded signing. Each value is the anchor text to
 * replace (placement 'replace' + a default size). Mirrors the TypeScript SDK's
 * `EmbeddedRecipientFields`.
 */
final class EmbeddedRecipientFields
{
    /**
     * @param string|null $signature Anchor text for the signature field (e.g. '{signature1}')
     * @param string|null $date Anchor text for the date field
     * @param string|null $initials Anchor text for the initials field
     * @param string|null $fullName Anchor text for the full-name field
     */
    public function __construct(
        public ?string $signature = null,
        public ?string $date = null,
        public ?string $initials = null,
        public ?string $fullName = null,
    ) {}
}
