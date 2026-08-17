package com.turbodocx.models.quote;

/**
 * Request to decline a quote.
 */
public class DeclineQuoteRequest {
    /** Optional for a draft quote, required for a sent one. Maximum 190 characters. */
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
