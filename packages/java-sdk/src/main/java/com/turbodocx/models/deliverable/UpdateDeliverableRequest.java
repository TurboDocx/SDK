package com.turbodocx.models.deliverable;

import java.util.List;

/**
 * Request to update a deliverable's info
 */
public class UpdateDeliverableRequest {
    private String name;
    private String description;
    private List<String> tags;

    public UpdateDeliverableRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}
