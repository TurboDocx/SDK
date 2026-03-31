package com.turbodocx.models.deliverable;

import java.util.List;

/**
 * Request to generate a new deliverable from a template
 */
public class CreateDeliverableRequest {
    private String name;
    private String templateId;
    private List<DeliverableVariable> variables;
    private String description;
    private List<String> tags;

    public CreateDeliverableRequest() {}

    public CreateDeliverableRequest(String name, String templateId, List<DeliverableVariable> variables) {
        this.name = name;
        this.templateId = templateId;
        this.variables = variables;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }
    public List<DeliverableVariable> getVariables() { return variables; }
    public void setVariables(List<DeliverableVariable> variables) { this.variables = variables; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}
