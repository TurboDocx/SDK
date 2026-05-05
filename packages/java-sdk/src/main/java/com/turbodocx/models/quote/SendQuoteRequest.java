package com.turbodocx.models.quote;

import java.util.List;

/**
 * Request to send a quote.
 */
public class SendQuoteRequest {
    private List<String> ccEmails;
    private String validUntil;

    public List<String> getCcEmails() { return ccEmails; }
    public void setCcEmails(List<String> ccEmails) { this.ccEmails = ccEmails; }
    public String getValidUntil() { return validUntil; }
    public void setValidUntil(String validUntil) { this.validUntil = validUntil; }
}
