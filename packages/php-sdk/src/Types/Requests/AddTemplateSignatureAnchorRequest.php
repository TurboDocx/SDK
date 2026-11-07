<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

use TurboDocx\Types\FieldPlacement;
use TurboDocx\Types\SignatureFieldType;

/**
 * Request for {@see \TurboDocx\TurboSign::addTemplateSignatureAnchor()}: one anchored field of a
 * template's saved signature setup, placed on every occurrence of its tag for one signer role.
 */
final class AddTemplateSignatureAnchorRequest
{
    /**
     * @param string $templateId ID of the template (sent in the path, not the body)
     * @param string $roleKey The role's key, as listed by
     *     {@see \TurboDocx\TurboSign::getTemplateSignatureSetup()}. On a template with no signer yet,
     *     `signer_1` creates the first signer.
     * @param SignatureFieldType $type The field type
     * @param string $anchor One tag in single braces with no spaces, like `{ClientSign}`
     * @param array{width: int|float, height: int|float}|null $size Size of the field
     * @param array{x: int|float, y: int|float}|null $offset Offset from the tag
     * @param FieldPlacement|null $placement Where the field sits relative to its tag
     * @param string|null $defaultValue The field's default value
     * @param bool|null $isReadonly A read-only field needs a default value, its own or its role's.
     *     `false` is forwarded rather than dropped.
     */
    public function __construct(
        public string $templateId,
        public string $roleKey,
        public SignatureFieldType $type,
        public string $anchor,
        public ?array $size = null,
        public ?array $offset = null,
        public ?FieldPlacement $placement = null,
        public ?string $defaultValue = null,
        public ?bool $isReadonly = null,
    ) {}

    /**
     * The JSON body: every set key except `templateId`, which goes in the path.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'roleKey' => $this->roleKey,
            'type' => $this->type->value,
            'anchor' => $this->anchor,
        ];
        if ($this->size !== null) {
            $data['size'] = $this->size;
        }
        if ($this->offset !== null) {
            $data['offset'] = $this->offset;
        }
        if ($this->placement !== null) {
            $data['placement'] = $this->placement->value;
        }
        if ($this->defaultValue !== null) {
            $data['defaultValue'] = $this->defaultValue;
        }
        if ($this->isReadonly !== null) {
            $data['isReadonly'] = $this->isReadonly;
        }
        return $data;
    }
}
