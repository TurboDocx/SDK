package com.turbodocx.models;

import java.util.List;
import java.util.Map;

/**
 * Request for generating a document from template
 */
public class GenerateTemplateRequest {
    private String templateId;

    private List<TemplateVariable> variables;

    private String name;

    private String description;

    private Boolean replaceFonts;

    private String defaultFont;

    private String outputFormat;

    private Map<String, Object> metadata;

    // Constructors
    public GenerateTemplateRequest() {
    }

    public GenerateTemplateRequest(String templateId, List<TemplateVariable> variables) {
        this.templateId = templateId;
        this.variables = variables;
    }

    // Getters and Setters
    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public List<TemplateVariable> getVariables() {
        return variables;
    }

    public void setVariables(List<TemplateVariable> variables) {
        this.variables = variables;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getReplaceFonts() {
        return replaceFonts;
    }

    public void setReplaceFonts(Boolean replaceFonts) {
        this.replaceFonts = replaceFonts;
    }

    public String getDefaultFont() {
        return defaultFont;
    }

    public void setDefaultFont(String defaultFont) {
        this.defaultFont = defaultFont;
    }

    public String getOutputFormat() {
        return outputFormat;
    }

    public void setOutputFormat(String outputFormat) {
        this.outputFormat = outputFormat;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    // Builder pattern
    public static class Builder {
        private final GenerateTemplateRequest request = new GenerateTemplateRequest();

        public Builder templateId(String templateId) {
            request.templateId = templateId;
            return this;
        }

        public Builder variables(List<TemplateVariable> variables) {
            request.variables = variables;
            return this;
        }

        public Builder name(String name) {
            request.name = name;
            return this;
        }

        public Builder description(String description) {
            request.description = description;
            return this;
        }

        public Builder replaceFonts(Boolean replaceFonts) {
            request.replaceFonts = replaceFonts;
            return this;
        }

        public Builder defaultFont(String defaultFont) {
            request.defaultFont = defaultFont;
            return this;
        }

        public Builder outputFormat(String outputFormat) {
            request.outputFormat = outputFormat;
            return this;
        }

        public Builder metadata(Map<String, Object> metadata) {
            request.metadata = metadata;
            return this;
        }

        public GenerateTemplateRequest build() {
            if (request.templateId == null || request.templateId.isEmpty()) {
                throw new IllegalStateException("templateId is required");
            }
            if (request.variables == null || request.variables.isEmpty()) {
                throw new IllegalStateException("variables are required");
            }
            return request;
        }
    }

    public static Builder builder() {
        return new Builder();
    }
}
