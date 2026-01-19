<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Field configuration supporting both coordinate-based and template anchor-based positioning
 */
final class Field
{
    /**
     * @param SignatureFieldType $type Field type
     * @param string $recipientEmail Which recipient fills this field
     * @param int|null $page Page number (1-indexed, required for coordinate-based positioning)
     * @param int|null $x X coordinate position
     * @param int|null $y Y coordinate position
     * @param int|null $width Field width in pixels
     * @param int|null $height Field height in pixels
     * @param TemplateConfig|null $template Template anchor configuration for dynamic positioning
     * @param string|null $defaultValue Default value for the field (for checkbox: "true" or "false")
     * @param bool $isMultiline Whether this is a multiline text field
     * @param bool $isReadonly Whether this field is read-only (pre-filled, non-editable)
     * @param bool $required Whether this field is required
     * @param string|null $backgroundColor Background color (hex, rgb, or named colors)
     */
    public function __construct(
        public SignatureFieldType $type,
        public string $recipientEmail,
        public ?int $page = null,
        public ?int $x = null,
        public ?int $y = null,
        public ?int $width = null,
        public ?int $height = null,
        public ?TemplateConfig $template = null,
        public ?string $defaultValue = null,
        public bool $isMultiline = false,
        public bool $isReadonly = false,
        public bool $required = false,
        public ?string $backgroundColor = null,
    ) {}

    /**
     * Convert to array for JSON serialization
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'type' => $this->type->value,
            'recipientEmail' => $this->recipientEmail,
        ];

        // Add coordinate positioning if provided
        if ($this->page !== null) {
            $data['page'] = $this->page;
        }
        if ($this->x !== null) {
            $data['x'] = $this->x;
        }
        if ($this->y !== null) {
            $data['y'] = $this->y;
        }
        if ($this->width !== null) {
            $data['width'] = $this->width;
        }
        if ($this->height !== null) {
            $data['height'] = $this->height;
        }

        // Add template configuration
        if ($this->template !== null) {
            $data['template'] = $this->template->toArray();
        }

        // Add optional properties
        if ($this->defaultValue !== null) {
            $data['defaultValue'] = $this->defaultValue;
        }
        if ($this->isMultiline) {
            $data['isMultiline'] = true;
        }
        if ($this->isReadonly) {
            $data['isReadonly'] = true;
        }
        if ($this->required) {
            $data['required'] = true;
        }
        if ($this->backgroundColor !== null) {
            $data['backgroundColor'] = $this->backgroundColor;
        }

        return $data;
    }
}
