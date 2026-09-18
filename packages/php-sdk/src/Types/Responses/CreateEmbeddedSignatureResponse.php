<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from {@see \TurboDocx\TurboSign::createEmbeddedSignature()}: the document plus a
 * per-recipient embed URL. Mirrors the TypeScript SDK's `CreateEmbeddedSignatureResponse`.
 */
final class CreateEmbeddedSignatureResponse
{
    /**
     * @param string $documentId The created document's id
     * @param array<EmbeddedSignatureRecipientResult> $recipients One entry per signer, in signing order
     */
    public function __construct(
        public string $documentId,
        public array $recipients,
    ) {}
}
