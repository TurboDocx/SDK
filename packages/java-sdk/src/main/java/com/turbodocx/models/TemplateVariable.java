package com.turbodocx.models;

import java.util.List;
import java.util.Map;

/**
 * Variable configuration for template generation
 * <p>
 * Supports both simple text replacement and advanced templating with Angular-like expressions
 */
public class TemplateVariable {
    private String placeholder;

    private String name;

    private Object value;

    private String text;

    private String mimeType;

    private Boolean usesAdvancedTemplatingEngine;

    private Boolean nestedInAdvancedTemplatingEngine;

    private Boolean allowRichTextInjection;

    private String description;

    private Boolean defaultValue;

    private List<TemplateVariable> subvariables;

    // Constructors
    public TemplateVariable() {
    }

    public TemplateVariable(String placeholder, Object value) {
        this.placeholder = placeholder;
        this.value = value;
    }

    // Getters and Setters
    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public void setMimeType(VariableMimeType mimeType) {
        this.mimeType = mimeType.getValue();
    }

    public Boolean getUsesAdvancedTemplatingEngine() {
        return usesAdvancedTemplatingEngine;
    }

    public void setUsesAdvancedTemplatingEngine(Boolean usesAdvancedTemplatingEngine) {
        this.usesAdvancedTemplatingEngine = usesAdvancedTemplatingEngine;
    }

    public Boolean getNestedInAdvancedTemplatingEngine() {
        return nestedInAdvancedTemplatingEngine;
    }

    public void setNestedInAdvancedTemplatingEngine(Boolean nestedInAdvancedTemplatingEngine) {
        this.nestedInAdvancedTemplatingEngine = nestedInAdvancedTemplatingEngine;
    }

    public Boolean getAllowRichTextInjection() {
        return allowRichTextInjection;
    }

    public void setAllowRichTextInjection(Boolean allowRichTextInjection) {
        this.allowRichTextInjection = allowRichTextInjection;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(Boolean defaultValue) {
        this.defaultValue = defaultValue;
    }

    public List<TemplateVariable> getSubvariables() {
        return subvariables;
    }

    public void setSubvariables(List<TemplateVariable> subvariables) {
        this.subvariables = subvariables;
    }

    // Builder pattern
    public static class Builder {
        private final TemplateVariable variable = new TemplateVariable();

        public Builder placeholder(String placeholder) {
            variable.placeholder = placeholder;
            return this;
        }

        public Builder name(String name) {
            variable.name = name;
            return this;
        }

        public Builder value(Object value) {
            variable.value = value;
            return this;
        }

        public Builder text(String text) {
            variable.text = text;
            return this;
        }

        public Builder mimeType(String mimeType) {
            variable.mimeType = mimeType;
            return this;
        }

        public Builder mimeType(VariableMimeType mimeType) {
            variable.mimeType = mimeType.getValue();
            return this;
        }

        public Builder usesAdvancedTemplatingEngine(Boolean usesAdvancedTemplatingEngine) {
            variable.usesAdvancedTemplatingEngine = usesAdvancedTemplatingEngine;
            return this;
        }

        public Builder nestedInAdvancedTemplatingEngine(Boolean nestedInAdvancedTemplatingEngine) {
            variable.nestedInAdvancedTemplatingEngine = nestedInAdvancedTemplatingEngine;
            return this;
        }

        public Builder allowRichTextInjection(Boolean allowRichTextInjection) {
            variable.allowRichTextInjection = allowRichTextInjection;
            return this;
        }

        public Builder description(String description) {
            variable.description = description;
            return this;
        }

        public Builder defaultValue(Boolean defaultValue) {
            variable.defaultValue = defaultValue;
            return this;
        }

        public Builder subvariables(List<TemplateVariable> subvariables) {
            variable.subvariables = subvariables;
            return this;
        }

        public TemplateVariable build() {
            if (variable.placeholder == null || variable.placeholder.isEmpty()) {
                throw new IllegalStateException("placeholder must be set");
            }
            if (variable.name == null || variable.name.isEmpty()) {
                throw new IllegalStateException("name must be set");
            }
            if (variable.mimeType == null || variable.mimeType.isEmpty()) {
                throw new IllegalStateException("mimeType must be set");
            }
            return variable;
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    // Helper factory methods

    /**
     * Creates a simple text variable
     * @param placeholder The variable placeholder (e.g., "{customer_name}")
     * @param name The variable name
     * @param value The value to substitute
     * @param mimeType The mime type (TEXT or HTML)
     * @throws IllegalArgumentException if any required parameter is missing or invalid
     */
    public static TemplateVariable simple(String placeholder, String name, Object value, VariableMimeType mimeType) {
        if (placeholder == null || placeholder.isEmpty()) {
            throw new IllegalArgumentException("placeholder is required");
        }
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("name is required");
        }
        if (mimeType == null) {
            throw new IllegalArgumentException("mimeType is required");
        }
        if (mimeType != VariableMimeType.TEXT && mimeType != VariableMimeType.HTML) {
            throw new IllegalArgumentException("mimeType must be TEXT or HTML");
        }
        return builder()
                .placeholder(placeholder)
                .name(name)
                .value(value)
                .mimeType(mimeType)
                .build();
    }

    /**
     * Creates an advanced engine variable (for nested objects, complex data)
     * @param placeholder The variable placeholder (e.g., "{user}")
     * @param name The variable name
     * @param value The nested object value
     * @throws IllegalArgumentException if any required parameter is missing
     */
    public static TemplateVariable advancedEngine(String placeholder, String name, Map<String, Object> value) {
        if (placeholder == null || placeholder.isEmpty()) {
            throw new IllegalArgumentException("placeholder is required");
        }
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("name is required");
        }
        return builder()
                .placeholder(placeholder)
                .name(name)
                .value(value)
                .mimeType(VariableMimeType.JSON)
                .usesAdvancedTemplatingEngine(true)
                .build();
    }

    /**
     * Creates a variable for array loops
     * @param placeholder The variable placeholder (e.g., "{products}")
     * @param name The variable name
     * @param value The array/list value
     * @throws IllegalArgumentException if any required parameter is missing
     */
    public static TemplateVariable loop(String placeholder, String name, List<?> value) {
        if (placeholder == null || placeholder.isEmpty()) {
            throw new IllegalArgumentException("placeholder is required");
        }
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("name is required");
        }
        return builder()
                .placeholder(placeholder)
                .name(name)
                .value(value)
                .mimeType(VariableMimeType.JSON)
                .usesAdvancedTemplatingEngine(true)
                .build();
    }

    /**
     * Creates a variable for conditionals
     * @param placeholder The variable placeholder (e.g., "{showDetails}")
     * @param name The variable name
     * @param value The boolean or truthy value
     * @throws IllegalArgumentException if any required parameter is missing
     */
    public static TemplateVariable conditional(String placeholder, String name, Object value) {
        if (placeholder == null || placeholder.isEmpty()) {
            throw new IllegalArgumentException("placeholder is required");
        }
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("name is required");
        }
        return builder()
                .placeholder(placeholder)
                .name(name)
                .value(value)
                .mimeType(VariableMimeType.JSON)
                .usesAdvancedTemplatingEngine(true)
                .build();
    }

    /**
     * Creates a variable for images
     * @param placeholder The variable placeholder (e.g., "{logo}")
     * @param name The variable name
     * @param imageUrl The image URL
     * @throws IllegalArgumentException if any required parameter is missing
     */
    public static TemplateVariable image(String placeholder, String name, String imageUrl) {
        if (placeholder == null || placeholder.isEmpty()) {
            throw new IllegalArgumentException("placeholder is required");
        }
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("name is required");
        }
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new IllegalArgumentException("imageUrl is required");
        }
        return builder()
                .placeholder(placeholder)
                .name(name)
                .value(imageUrl)
                .mimeType(VariableMimeType.IMAGE)
                .build();
    }
}
