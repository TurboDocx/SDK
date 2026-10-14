<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * One signer role of a template, as returned by
 * {@see \TurboDocx\TurboSign::getTemplateSignatureSetup()}.
 */
final class TemplateSignatureRole
{
    /**
     * @param string $key The value to pass as a Recipient's `role`
     * @param string $label The role's name in the TurboDocx UI
     * @param int $order Signing order of this role
     * @param bool $hasSavedSigner True when the template has a saved signer for this role, used if
     *     you leave the role out
     * @param int $fieldCount How many fields are saved for this role
     * @param string|null $defaultName The saved signer's name (only when $hasSavedSigner)
     * @param string|null $defaultEmail The saved signer's email (only when $hasSavedSigner)
     */
    public function __construct(
        public string $key,
        public string $label,
        public int $order,
        public bool $hasSavedSigner,
        public int $fieldCount,
        public ?string $defaultName = null,
        public ?string $defaultEmail = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            key: (string) ($data['key'] ?? ''),
            label: (string) ($data['label'] ?? ''),
            order: (int) ($data['order'] ?? 0),
            hasSavedSigner: (bool) ($data['hasSavedSigner'] ?? false),
            fieldCount: (int) ($data['fieldCount'] ?? 0),
            defaultName: isset($data['defaultName']) ? (string) $data['defaultName'] : null,
            defaultEmail: isset($data['defaultEmail']) ? (string) $data['defaultEmail'] : null,
        );
    }
}
