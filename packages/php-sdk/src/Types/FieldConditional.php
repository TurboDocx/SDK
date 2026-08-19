<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Conditional (IF/THEN) rule set on a DEPENDENT field.
 *
 * The dependent field reacts to a CONTROLLING checkbox elsewhere in the same fields array.
 * The controlling field must be SignatureFieldType::CHECKBOX and carry a FieldMetadata fieldKey;
 * this rule references it by that exact key.
 */
final class FieldConditional
{
    /**
     * @param string $controllingFieldKey Must equal the controlling checkbox's FieldMetadata fieldKey
     * @param ConditionalOperator $operator Whether the rule fires when the checkbox is checked or unchecked
     * @param ConditionalAction $action Whether the dependent field is hidden (show) or read-only (unlock) until met
     */
    public function __construct(
        public string $controllingFieldKey,
        public ConditionalOperator $operator,
        public ConditionalAction $action,
    ) {}

    /**
     * Convert to array for JSON serialization
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'controllingFieldKey' => $this->controllingFieldKey,
            'operator' => $this->operator->value,
            'action' => $this->action->value,
        ];
    }
}
