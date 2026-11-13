<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Result of {@see \TurboDocx\TurboSign::addTemplateSignatureAnchor()}.
 */
final class AddTemplateSignatureAnchorResponse
{
    /**
     * @param string $fieldId The anchored field's id
     * @param array<string, mixed> $signatureSetup The template's saved signature setup as stored
     *     (`roles`, `fields`, ...)
     * @param bool $tagBecameSignatureField True when the tag was not a signature field before; the
     *     template's own values for it were cleared
     */
    public function __construct(
        public string $fieldId,
        public array $signatureSetup,
        public bool $tagBecameSignatureField,
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            fieldId: (string) ($data['fieldId'] ?? ''),
            signatureSetup: is_array($data['signatureSetup'] ?? null) ? $data['signatureSetup'] : [],
            tagBecameSignatureField: (bool) ($data['tagBecameSignatureField'] ?? false),
        );
    }
}
