<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * A field of a template's saved signature setup that is anchored to a tag like `{ClientSign}`, as
 * returned by {@see \TurboDocx\TurboSign::getTemplateSignatureSetup()}.
 *
 * `type` and `placement` are the plain strings the API returns (for example `signature` and
 * `replace`), so a value added later on the server never breaks parsing.
 */
final class TemplateSignatureAnchor
{
    /**
     * @param string|null $fieldId Pass to {@see \TurboDocx\TurboSign::removeTemplateSignatureAnchor()}
     *     (absent on older setups)
     * @param string $roleKey The key of the role that fills this field
     * @param string $type The field type, a {@see \TurboDocx\Types\SignatureFieldType} value
     * @param string $anchor The tag, in single braces
     * @param string $placement Where the field sits relative to its tag, a
     *     {@see \TurboDocx\Types\FieldPlacement} value
     * @param bool $notFound True when the template has no variable (Word/PowerPoint) or text (PDF)
     *     with this tag
     * @param array{x: int|float, y: int|float}|null $offset Offset from the tag
     * @param array{width: int|float, height: int|float}|null $size Size of the field
     */
    public function __construct(
        public ?string $fieldId,
        public string $roleKey,
        public string $type,
        public string $anchor,
        public string $placement,
        public bool $notFound,
        public ?array $offset = null,
        public ?array $size = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $offset = is_array($data['offset'] ?? null) ? $data['offset'] : null;
        $size = is_array($data['size'] ?? null) ? $data['size'] : null;

        return new self(
            fieldId: isset($data['fieldId']) ? (string) $data['fieldId'] : null,
            roleKey: (string) ($data['roleKey'] ?? ''),
            type: (string) ($data['type'] ?? ''),
            anchor: (string) ($data['anchor'] ?? ''),
            placement: (string) ($data['placement'] ?? ''),
            notFound: (bool) ($data['notFound'] ?? false),
            offset: $offset === null ? null : ['x' => self::number($offset['x'] ?? 0), 'y' => self::number($offset['y'] ?? 0)],
            size: $size === null ? null : [
                'width' => self::number($size['width'] ?? 0),
                'height' => self::number($size['height'] ?? 0),
            ],
        );
    }

    private static function number(mixed $value): int|float
    {
        return is_int($value) || is_float($value) ? $value : (float) (is_numeric($value) ? $value : 0);
    }
}
