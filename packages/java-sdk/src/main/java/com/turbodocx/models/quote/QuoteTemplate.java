package com.turbodocx.models.quote;

/**
 * Quote template domain entity.
 */
public class QuoteTemplate {
    private String id;
    private String orgId;
    private String logoUrl;
    private String primaryColor;
    private String primaryTextColor;
    private String disclaimer;
    private String termsAndConditions;
    private String closingMessage;
    private String senderName;
    private String senderPhone;
    private String senderEmail;
    private String contactEmail;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getLogoUrl() { return logoUrl; }
    public String getPrimaryColor() { return primaryColor; }
    public String getPrimaryTextColor() { return primaryTextColor; }
    public String getDisclaimer() { return disclaimer; }
    public String getTermsAndConditions() { return termsAndConditions; }
    public String getClosingMessage() { return closingMessage; }
    public String getSenderName() { return senderName; }
    public String getSenderPhone() { return senderPhone; }
    public String getSenderEmail() { return senderEmail; }
    public String getContactEmail() { return contactEmail; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
}
