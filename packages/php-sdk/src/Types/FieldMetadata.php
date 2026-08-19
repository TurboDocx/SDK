<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Optional per-field metadata for conditional (IF/THEN) logic.
 *
 * Set $fieldKey on a CONTROLLING checkbox to give it a stable client id; set $conditional on a
 * DEPENDENT field to make it react to that checkbox. Both sides are authored by the caller in
 * the same payload.
 */
final class FieldMetadata
{
    /**
     * @param string|null $fieldKey Stable client id (<=100 chars) for a controlling checkbox, referenced by dependents
     * @param FieldConditional|null $conditional Conditional rule set on a dependent field
     */
    public function __construct(
        public ?string $fieldKey = null,
        public ?FieldConditional $conditional = null,
    ) {}

    /**
     * Convert to array for JSON serialization
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->fieldKey !== null) {
            $data['fieldKey'] = $this->fieldKey;
        }
        if ($this->conditional !== null) {
            $data['conditional'] = $this->conditional->toArray();
        }

        return $data;
    }
}
