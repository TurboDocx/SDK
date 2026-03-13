package com.turbodocx.models.deliverable;

import java.util.List;

/**
 * Full deliverable record
 */
public class DeliverableRecord {
    private String id;
    private String name;
    private String description;
    private String templateId;
    private String templateName;
    private Boolean templateNotDeleted;
    private String createdBy;
    private String email;
    private Long fileSize;
    private String fileType;
    private String defaultFont;
    private boolean isActive;
    private String createdOn;
    private String updatedOn;
    private List<DeliverableVariable> variables;
    private List<Tag> tags;

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getTemplateId() { return templateId; }
    public String getTemplateName() { return templateName; }
    public Boolean getTemplateNotDeleted() { return templateNotDeleted; }
    public String getCreatedBy() { return createdBy; }
    public String getEmail() { return email; }
    public Long getFileSize() { return fileSize; }
    public String getFileType() { return fileType; }
    public String getDefaultFont() { return defaultFont; }
    public boolean isActive() { return isActive; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public List<DeliverableVariable> getVariables() { return variables; }
    public List<Tag> getTags() { return tags; }

    public static class Tag {
        private String id;
        private String name;

        public String getId() { return id; }
        public String getName() { return name; }
    }
}
