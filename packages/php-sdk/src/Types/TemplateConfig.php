<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Template anchor configuration for dynamic field positioning
 */
final class TemplateConfig
{
    /**
     * @param string|null $anchor Text anchor pattern like {TagName}
     * @param string|null $searchText Alternative: search for any text in document
     * @param FieldPlacement|null $placement Where to place field relative to anchor/searchText
     * @param array{width: int, height: int}|null $size Size of the field
     * @param array{x: int, y: int}|null $offset Offset from anchor position
     * @param bool $caseSensitive Case sensitive search (default: false)
     * @param bool $useRegex Use regex for anchor/searchText (default: false)
     */
    public function __construct(
        public ?string $anchor = null,
        public ?string $searchText = null,
        public ?FieldPlacement $placement = null,
        public ?array $size = null,
        public ?array $offset = null,
        public bool $caseSensitive = false,
        public bool $useRegex = false,
    ) {}

    /**
     * Convert to array for JSON serialization
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->anchor !== null) {
            $data['anchor'] = $this->anchor;
        }
        if ($this->searchText !== null) {
            $data['searchText'] = $this->searchText;
        }
        if ($this->placement !== null) {
            $data['placement'] = $this->placement->value;
        }
        if ($this->size !== null) {
            $data['size'] = $this->size;
        }
        if ($this->offset !== null) {
            $data['offset'] = $this->offset;
        }
        if ($this->caseSensitive) {
            $data['caseSensitive'] = true;
        }
        if ($this->useRegex) {
            $data['useRegex'] = true;
        }

        return $data;
    }
}
