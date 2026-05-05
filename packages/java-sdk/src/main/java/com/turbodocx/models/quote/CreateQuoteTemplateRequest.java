package com.turbodocx.models.quote;

/**
 * Request to create a quote template.
 */
public class CreateQuoteTemplateRequest {
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

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }
    public String getPrimaryTextColor() { return primaryTextColor; }
    public void setPrimaryTextColor(String primaryTextColor) { this.primaryTextColor = primaryTextColor; }
    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; }
    public String getClosingMessage() { return closingMessage; }
    public void setClosingMessage(String closingMessage) { this.closingMessage = closingMessage; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getSenderPhone() { return senderPhone; }
    public void setSenderPhone(String senderPhone) { this.senderPhone = senderPhone; }
    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
}
