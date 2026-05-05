package com.turbodocx.models.quote;

/**
 * Request to decline a quote.
 */
public class DeclineQuoteRequest {
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
