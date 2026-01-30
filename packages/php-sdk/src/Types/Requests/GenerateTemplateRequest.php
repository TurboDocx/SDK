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
     * @param string $templateId Template ID
     * @param array<TemplateVariable> $variables Template variables
     * @param string|null $name Document name
     * @param string|null $description Document description
     * @param bool|null $replaceFonts Whether to replace fonts
     * @param string|null $defaultFont Default font to use
     * @param array<string, mixed>|null $metadata Additional metadata
     */
    public function __construct(
        public string $templateId,
        public array $variables,
        public ?string $name = null,
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
        ];

        // Add optional parameters if set
        if ($this->name !== null) {
            $data['name'] = $this->name;
        }
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
