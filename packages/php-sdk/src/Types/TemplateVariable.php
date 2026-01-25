<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Variable configuration for template generation
 *
 * Supports both simple text replacement and advanced templating with Angular-like expressions
 */
class TemplateVariable
{
    /**
     * @param string $placeholder Variable placeholder (e.g., "{customer_name}")
     * @param string $name Variable name
     * @param VariableMimeType $mimeType MIME type of the variable
     * @param mixed $value Variable value (can be string, number, boolean, array, object, or null)
     * @param string|null $text Alternative to value for text content
     * @param bool|null $usesAdvancedTemplatingEngine Enable advanced templating engine
     * @param bool|null $nestedInAdvancedTemplatingEngine Marks variable as nested
     * @param bool|null $allowRichTextInjection Allow rich text injection
     * @param string|null $description Variable description
     * @param bool|null $defaultValue Whether this is a default value
     * @param array<TemplateVariable>|null $subvariables Nested sub-variables
     */
    public function __construct(
        public string $placeholder,
        public string $name,
        public VariableMimeType $mimeType,
        public mixed $value = null,
        public ?string $text = null,
        public ?bool $usesAdvancedTemplatingEngine = null,
        public ?bool $nestedInAdvancedTemplatingEngine = null,
        public ?bool $allowRichTextInjection = null,
        public ?string $description = null,
        public ?bool $defaultValue = null,
        public ?array $subvariables = null
    ) {
    }

    /**
     * Convert to array for JSON serialization
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'placeholder' => $this->placeholder,
            'name' => $this->name,
            'mimeType' => $this->mimeType->value,
        ];

        // Add value/text if present - allow null values
        if (array_key_exists('value', get_object_vars($this))) {
            $data['value'] = $this->value;
        }
        if ($this->text !== null) {
            $data['text'] = $this->text;
        }

        // Add optional boolean flags if set
        if ($this->usesAdvancedTemplatingEngine !== null) {
            $data['usesAdvancedTemplatingEngine'] = $this->usesAdvancedTemplatingEngine;
        }
        if ($this->nestedInAdvancedTemplatingEngine !== null) {
            $data['nestedInAdvancedTemplatingEngine'] = $this->nestedInAdvancedTemplatingEngine;
        }
        if ($this->allowRichTextInjection !== null) {
            $data['allowRichTextInjection'] = $this->allowRichTextInjection;
        }

        // Add optional string fields if set
        if ($this->description !== null) {
            $data['description'] = $this->description;
        }
        if ($this->defaultValue !== null) {
            $data['defaultValue'] = $this->defaultValue;
        }
        if ($this->subvariables !== null) {
            $data['subvariables'] = array_map(fn($v) => $v->toArray(), $this->subvariables);
        }

        return $data;
    }

    /**
     * Helper: Create a simple text variable
     *
     * @param string $placeholder Variable placeholder (e.g., "{customer_name}")
     * @param string $name Variable name
     * @param string|int|float|bool $value Variable value
     * @param VariableMimeType $mimeType MIME type ('TEXT' or 'HTML')
     * @return self
     */
    public static function simple(
        string $placeholder,
        string $name,
        string|int|float|bool $value,
        VariableMimeType $mimeType = VariableMimeType::TEXT
    ): self {
        if (empty($placeholder)) {
            throw new \InvalidArgumentException('placeholder is required');
        }
        if (empty($name)) {
            throw new \InvalidArgumentException('name is required');
        }
        if ($mimeType !== VariableMimeType::TEXT && $mimeType !== VariableMimeType::HTML) {
            throw new \InvalidArgumentException('mimeType must be TEXT or HTML for simple variables');
        }

        return new self(
            placeholder: $placeholder,
            name: $name,
            mimeType: $mimeType,
            value: $value
        );
    }

    /**
     * Helper: Create an advanced engine variable (for nested objects, complex data)
     *
     * @param string $placeholder Variable placeholder (e.g., "{user}")
     * @param string $name Variable name
     * @param array<string, mixed> $value Nested object value
     * @return self
     */
    public static function advancedEngine(
        string $placeholder,
        string $name,
        array $value
    ): self {
        if (empty($placeholder)) {
            throw new \InvalidArgumentException('placeholder is required');
        }
        if (empty($name)) {
            throw new \InvalidArgumentException('name is required');
        }

        return new self(
            placeholder: $placeholder,
            name: $name,
            mimeType: VariableMimeType::JSON,
            value: $value,
            usesAdvancedTemplatingEngine: true
        );
    }

    /**
     * Helper: Create a variable for array loops
     *
     * @param string $placeholder Variable placeholder (e.g., "{products}")
     * @param string $name Variable name
     * @param array<mixed> $value Array/list value
     * @return self
     */
    public static function loop(
        string $placeholder,
        string $name,
        array $value
    ): self {
        if (empty($placeholder)) {
            throw new \InvalidArgumentException('placeholder is required');
        }
        if (empty($name)) {
            throw new \InvalidArgumentException('name is required');
        }

        return new self(
            placeholder: $placeholder,
            name: $name,
            mimeType: VariableMimeType::JSON,
            value: $value,
            usesAdvancedTemplatingEngine: true
        );
    }

    /**
     * Helper: Create a variable for conditionals
     *
     * @param string $placeholder Variable placeholder (e.g., "{showDetails}")
     * @param string $name Variable name
     * @param mixed $value Boolean or truthy value
     * @return self
     */
    public static function conditional(
        string $placeholder,
        string $name,
        mixed $value
    ): self {
        if (empty($placeholder)) {
            throw new \InvalidArgumentException('placeholder is required');
        }
        if (empty($name)) {
            throw new \InvalidArgumentException('name is required');
        }

        return new self(
            placeholder: $placeholder,
            name: $name,
            mimeType: VariableMimeType::JSON,
            value: $value,
            usesAdvancedTemplatingEngine: true
        );
    }

    /**
     * Helper: Create a variable for images
     *
     * @param string $placeholder Variable placeholder (e.g., "{logo}")
     * @param string $name Variable name
     * @param string $imageUrl Image URL or base64 data
     * @return self
     */
    public static function image(
        string $placeholder,
        string $name,
        string $imageUrl
    ): self {
        if (empty($placeholder)) {
            throw new \InvalidArgumentException('placeholder is required');
        }
        if (empty($name)) {
            throw new \InvalidArgumentException('name is required');
        }
        if (empty($imageUrl)) {
            throw new \InvalidArgumentException('imageUrl is required');
        }

        return new self(
            placeholder: $placeholder,
            name: $name,
            mimeType: VariableMimeType::IMAGE,
            value: $imageUrl
        );
    }
}
