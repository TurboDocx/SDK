<?php

declare(strict_types=1);

namespace TurboDocx\Types\Partner;

/**
 * The partner-settable slice of an organization's TurboSign display preferences.
 * Every key is present with its effective boolean value when read.
 */
final class PartnerOrgPreferences implements \JsonSerializable
{
    public function __construct(
        public readonly bool $hideSignatureOutline = false,
        public readonly bool $hideSignatureHash = false,
        public readonly bool $lockedFieldsBackground = false,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            hideSignatureOutline: (bool) ($data['hideSignatureOutline'] ?? false),
            hideSignatureHash: (bool) ($data['hideSignatureHash'] ?? false),
            lockedFieldsBackground: (bool) ($data['lockedFieldsBackground'] ?? false),
        );
    }

    /**
     * @return array<string, bool>
     */
    public function toArray(): array
    {
        return [
            'hideSignatureOutline' => $this->hideSignatureOutline,
            'hideSignatureHash' => $this->hideSignatureHash,
            'lockedFieldsBackground' => $this->lockedFieldsBackground,
        ];
    }

    /**
     * @return array<string, bool>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
