package com.turbodocx.models;

/**
 * Variable MIME types supported by TurboDocx
 */
public enum VariableMimeType {
    TEXT("text"),
    HTML("html"),
    IMAGE("image"),
    MARKDOWN("markdown"),
    JSON("json");

    private final String value;

    VariableMimeType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }

    public static VariableMimeType fromString(String value) {
        for (VariableMimeType type : VariableMimeType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown VariableMimeType: " + value);
    }
}
