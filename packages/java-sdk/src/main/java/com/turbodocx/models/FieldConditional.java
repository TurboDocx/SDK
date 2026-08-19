package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Conditional (IF/THEN) rule set on a DEPENDENT field.
 *
 * The dependent field reacts to a CONTROLLING checkbox elsewhere in the same fields list.
 * The controlling field must be type "checkbox" and carry FieldMetadata.fieldKey; this rule
 * references it by that exact key.
 *
 * operator is "is_checked" or "is_not_checked".
 * action is "show" (hidden until met) or "unlock" (visible but read-only until met).
 */
public class FieldConditional {
    @SerializedName("controllingFieldKey")
    private final String controllingFieldKey;

    @SerializedName("operator")
    private final String operator;

    @SerializedName("action")
    private final String action;

    /**
     * @param controllingFieldKey must equal the controlling checkbox's FieldMetadata.fieldKey
     * @param operator "is_checked" or "is_not_checked"
     * @param action "show" or "unlock"
     */
    public FieldConditional(String controllingFieldKey, String operator, String action) {
        this.controllingFieldKey = controllingFieldKey;
        this.operator = operator;
        this.action = action;
    }

    public String getControllingFieldKey() { return controllingFieldKey; }
    public String getOperator() { return operator; }
    public String getAction() { return action; }
}
