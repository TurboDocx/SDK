<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests;

use TurboDocx\Types\TemplateVariable;

/**
 * Request for generating a document from template
 */
class GenerateTemplateRequest
{
    /**
     * @param string $templateId Template ID (required)
     * @param array<TemplateVariable> $variables Template variables (required)
     * @param string $name Document name (required)
     * @param string|null $description Document description (optional)
     * @param bool|null $replaceFonts Whether to replace fonts (optional)
     * @param string|null $defaultFont Default font to use (optional)
     * @param array<string, mixed>|null $metadata Additional metadata (optional)
     */
    public function __construct(
        public string $templateId,
        public array $variables,
        public string $name,
        public ?string $description = null,
        public ?bool $replaceFonts = null,
        public ?string $defaultFont = null,
        public ?array $metadata = null
    ) {
        if (empty($templateId)) {
            throw new \InvalidArgumentException('templateId is required');
        }
        if (empty($variables)) {
            throw new \InvalidArgumentException('variables are required');
        }
        if (empty($name)) {
            throw new \InvalidArgumentException('name is required');
        }
    }

    /**
     * Convert to array for JSON serialization
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'templateId' => $this->templateId,
            'variables' => array_map(fn($v) => $v->toArray(), $this->variables),
            'name' => $this->name,
        ];

        // Add optional parameters if set
        if ($this->description !== null) {
            $data['description'] = $this->description;
        }
        if ($this->replaceFonts !== null) {
            $data['replaceFonts'] = $this->replaceFonts;
        }
        if ($this->defaultFont !== null) {
            $data['defaultFont'] = $this->defaultFont;
        }
        // Note: outputFormat is not supported in TurboTemplate API
        if ($this->metadata !== null) {
            $data['metadata'] = $this->metadata;
        }

        return $data;
    }
}
