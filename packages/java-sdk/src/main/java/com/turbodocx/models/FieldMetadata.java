package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Optional per-field metadata for conditional (IF/THEN) logic.
 *
 * Set fieldKey on a CONTROLLING checkbox to give it a stable client id; set conditional on a
 * DEPENDENT field to make it react to that checkbox. Both sides are authored by the caller in
 * the same payload.
 */
public class FieldMetadata {
    @SerializedName("fieldKey")
    private final String fieldKey;

    @SerializedName("conditional")
    private final FieldConditional conditional;

    /**
     * @param fieldKey stable client id (&lt;=100 chars) for a controlling checkbox, referenced by dependents
     * @param conditional conditional rule set on a dependent field
     */
    public FieldMetadata(String fieldKey, FieldConditional conditional) {
        this.fieldKey = fieldKey;
        this.conditional = conditional;
    }

    /** Convenience for a controlling checkbox that only carries a fieldKey. */
    public static FieldMetadata forFieldKey(String fieldKey) {
        return new FieldMetadata(fieldKey, null);
    }

    /** Convenience for a dependent field that only carries a conditional rule. */
    public static FieldMetadata forConditional(FieldConditional conditional) {
        return new FieldMetadata(null, conditional);
    }

    public String getFieldKey() { return fieldKey; }
    public FieldConditional getConditional() { return conditional; }
}
