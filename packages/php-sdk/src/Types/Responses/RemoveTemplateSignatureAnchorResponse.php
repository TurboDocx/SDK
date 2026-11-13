<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Result of {@see \TurboDocx\TurboSign::removeTemplateSignatureAnchor()}.
 */
final class RemoveTemplateSignatureAnchorResponse
{
    /**
     * @param array<string, mixed> $signatureSetup The template's saved signature setup as stored,
     *     without the removed field
     */
    public function __construct(
        public array $signatureSetup,
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            signatureSetup: is_array($data['signatureSetup'] ?? null) ? $data['signatureSetup'] : [],
        );
    }
}
