package com.turbodocx.models;

import java.util.Map;

/**
 * Response from template generation
 */
public class GenerateTemplateResponse {
    private String id;
    private String name;
    private String description;
    private String templateId;
    private String projectspaceId;
    private String deliverableFolderId;
    private Map<String, Object> metadata;
    private String createdBy;
    private String orgId;
    private String defaultFont;
    private String createdOn;
    private String updatedOn;
    private Integer isActive;
    private Object fonts;
    private byte[] buffer;
    private String downloadUrl;
    private String message;
    private String error;

    // Constructors
    public GenerateTemplateResponse() {
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public String getProjectspaceId() {
        return projectspaceId;
    }

    public void setProjectspaceId(String projectspaceId) {
        this.projectspaceId = projectspaceId;
    }

    public String getDeliverableFolderId() {
        return deliverableFolderId;
    }

    public void setDeliverableFolderId(String deliverableFolderId) {
        this.deliverableFolderId = deliverableFolderId;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public String getDefaultFont() {
        return defaultFont;
    }

    public void setDefaultFont(String defaultFont) {
        this.defaultFont = defaultFont;
    }

    public String getCreatedOn() {
        return createdOn;
    }

    public void setCreatedOn(String createdOn) {
        this.createdOn = createdOn;
    }

    public String getUpdatedOn() {
        return updatedOn;
    }

    public void setUpdatedOn(String updatedOn) {
        this.updatedOn = updatedOn;
    }

    public Integer getIsActive() {
        return isActive;
    }

    public void setIsActive(Integer isActive) {
        this.isActive = isActive;
    }

    public Object getFonts() {
        return fonts;
    }

    public void setFonts(Object fonts) {
        this.fonts = fonts;
    }

    public byte[] getBuffer() {
        return buffer;
    }

    public void setBuffer(byte[] buffer) {
        this.buffer = buffer;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    // Legacy compatibility - keep deliverableId as alias for id
    public String getDeliverableId() {
        return id;
    }

    public void setDeliverableId(String deliverableId) {
        this.id = deliverableId;
    }
}
