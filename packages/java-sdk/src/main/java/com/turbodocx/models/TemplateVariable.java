package com.turbodocx.models;

import com.fasterxml.jackson.annotation.json.JsonProperty;
import java.util.List;
import java.util.Map;

/**
 * Variable configuration for template generation
 * <p>
 * Supports both simple text replacement and advanced templating with Angular-like expressions
 */
public class TemplateVariable {
    @JsonProperty("placeholder")
    private String placeholder;

    @JsonProperty("name")
    private String name;

    @JsonProperty("value")
    private Object value;

    @JsonProperty("text")
    private String text;

    @JsonProperty("mimeType")
    private String mimeType;

    @JsonProperty("usesAdvancedTemplatingEngine")
    private Boolean usesAdvancedTemplatingEngine;

    @JsonProperty("nestedInAdvancedTemplatingEngine")
    private Boolean nestedInAdvancedTemplatingEngine;

    @JsonProperty("allowRichTextInjection")
    private Boolean allowRichTextInjection;

    @JsonProperty("description")
    private String description;

    @JsonProperty("defaultValue")
    private Boolean defaultValue;

    @JsonProperty("subvariables")
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
            if (variable.value == null && variable.text == null) {
                throw new IllegalStateException("Either value or text must be set");
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
     * @param name The variable name (used as placeholder if not provided)
     * @param value The value to substitute
     * @param placeholder Optional placeholder override (defaults to {name})
     */
    public static TemplateVariable simple(String name, Object value, String... placeholder) {
        String p = getPlaceholder(name, placeholder);
        return builder()
                .placeholder(p)
                .name(name)
                .value(value)
                .mimeType(VariableMimeType.TEXT)
                .build();
    }

    /**
     * Creates an advanced engine variable (for nested objects, complex data)
     * @param name The variable name
     * @param value The nested object value
     * @param placeholder Optional placeholder override (defaults to {name})
     */
    public static TemplateVariable advancedEngine(String name, Map<String, Object> value, String... placeholder) {
        String p = getPlaceholder(name, placeholder);
        return builder()
                .placeholder(p)
                .name(name)
                .value(value)
                .mimeType(VariableMimeType.JSON)
                .usesAdvancedTemplatingEngine(true)
                .build();
    }

    /**
     * Creates a variable for array loops
     * @param name The variable name
     * @param value The array/list value
     * @param placeholder Optional placeholder override (defaults to {name})
     */
    public static TemplateVariable loop(String name, List<?> value, String... placeholder) {
        String p = getPlaceholder(name, placeholder);
        return builder()
                .placeholder(p)
                .name(name)
                .value(value)
                .mimeType(VariableMimeType.JSON)
                .usesAdvancedTemplatingEngine(true)
                .build();
    }

    /**
     * Creates a variable for conditionals
     * @param name The variable name
     * @param value The boolean or truthy value
     * @param placeholder Optional placeholder override (defaults to {name})
     */
    public static TemplateVariable conditional(String name, Object value, String... placeholder) {
        String p = getPlaceholder(name, placeholder);
        return builder()
                .placeholder(p)
                .name(name)
                .value(value)
                .mimeType(VariableMimeType.JSON)
                .usesAdvancedTemplatingEngine(true)
                .build();
    }

    /**
     * Creates a variable for images
     * @param name The variable name
     * @param imageUrl The image URL
     * @param placeholder Optional placeholder override (defaults to {name})
     */
    public static TemplateVariable image(String name, String imageUrl, String... placeholder) {
        String p = getPlaceholder(name, placeholder);
        return builder()
                .placeholder(p)
                .name(name)
                .value(imageUrl)
                .mimeType(VariableMimeType.IMAGE)
                .build();
    }

    /**
     * Helper to determine placeholder from name and optional override
     */
    private static String getPlaceholder(String name, String... placeholder) {
        if (placeholder.length > 0 && placeholder[0] != null && !placeholder[0].isEmpty()) {
            return placeholder[0];
        }
        if (name.startsWith("{")) {
            return name;
        }
        return "{" + name + "}";
    }
}
