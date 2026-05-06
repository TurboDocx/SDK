package com.turbodocx.models.quote;

/**
 * Request to create a quote template.
 *
 * <p>Extends {@link TrackableRequest} so that the subclass
 * {@link UpdateQuoteTemplateRequest} inherits field-tracking for PATCH.
 * The tracking is harmless for CREATE (POST) since those paths don't
 * call {@code buildPatchBody()}.</p>
 */
public class CreateQuoteTemplateRequest extends TrackableRequest {
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
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; markFieldSet("logoUrl"); }
    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; markFieldSet("primaryColor"); }
    public String getPrimaryTextColor() { return primaryTextColor; }
    public void setPrimaryTextColor(String primaryTextColor) { this.primaryTextColor = primaryTextColor; markFieldSet("primaryTextColor"); }
    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; markFieldSet("disclaimer"); }
    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; markFieldSet("termsAndConditions"); }
    public String getClosingMessage() { return closingMessage; }
    public void setClosingMessage(String closingMessage) { this.closingMessage = closingMessage; markFieldSet("closingMessage"); }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; markFieldSet("senderName"); }
    public String getSenderPhone() { return senderPhone; }
    public void setSenderPhone(String senderPhone) { this.senderPhone = senderPhone; markFieldSet("senderPhone"); }
    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; markFieldSet("senderEmail"); }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; markFieldSet("contactEmail"); }
}
