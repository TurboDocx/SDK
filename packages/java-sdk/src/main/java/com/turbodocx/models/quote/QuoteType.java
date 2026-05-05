package com.turbodocx.models.quote;

import java.util.List;

/**
 * Quote type / category domain entity.
 */
public class QuoteType {
    private String id;
    private String orgId;
    private String name;
    private String categoryType;
    private Boolean isDefault;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private Usage usage;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getName() { return name; }
    public String getCategoryType() { return categoryType; }
    public Boolean getIsDefault() { return isDefault; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public Usage getUsage() { return usage; }

    /**
     * Usage information for a type.
     */
    public static class Usage {
        private Boolean inUse;
        private Integer usageCount;
        private List<String> usedIn;

        public Boolean getInUse() { return inUse; }
        public Integer getUsageCount() { return usageCount; }
        public List<String> getUsedIn() { return usedIn; }
    }
}
