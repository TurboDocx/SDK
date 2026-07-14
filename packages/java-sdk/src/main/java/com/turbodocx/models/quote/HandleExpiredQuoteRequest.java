package com.turbodocx.models.quote;

/**
 * Request to handle an expired sent quote. Voids or declines the original quote and
 * creates a duplicate carrying the new {@code newValidUntil} date.
 *
 * <p>All three fields are required.
 */
public class HandleExpiredQuoteRequest {
    /** Either {@code "void"} or {@code "decline"}. No other value is accepted. Required. */
    private String action;
    /** Required. Maximum 190 characters. */
    private String reason;
    /** Required. ISO 8601 date carried by the replacement quote. */
    private String newValidUntil;

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getNewValidUntil() { return newValidUntil; }
    public void setNewValidUntil(String newValidUntil) { this.newValidUntil = newValidUntil; }
}
