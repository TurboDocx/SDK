package com.turbodocx.models.deliverable;

import java.util.List;

public class DeliverableItem {
    private String id;
    private String name;
    private String description;
    private String type;
    private String createdOn;
    private String updatedOn;
    private boolean isActive;
    private String createdBy;
    private String email;
    private Long fileSize;
    private String fileType;
    private Integer deliverableCount;
    private Boolean templateNotDeleted;
    private List<DeliverableRecord.Tag> tags;

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getType() { return type; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public boolean isActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getEmail() { return email; }
    public Long getFileSize() { return fileSize; }
    public String getFileType() { return fileType; }
    public Integer getDeliverableCount() { return deliverableCount; }
    public Boolean getTemplateNotDeleted() { return templateNotDeleted; }
    public List<DeliverableRecord.Tag> getTags() { return tags; }
}
