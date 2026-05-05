package com.turbodocx.models.quote;

/**
 * Request to handle an expired sent quote.
 */
public class HandleExpiredQuoteRequest {
    private String action;
    private String reason;
    private String newValidUntil;

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getNewValidUntil() { return newValidUntil; }
    public void setNewValidUntil(String newValidUntil) { this.newValidUntil = newValidUntil; }
}
