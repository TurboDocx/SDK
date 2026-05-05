package com.turbodocx.models.quote;

/**
 * Request to void a quote.
 */
public class VoidQuoteRequest {
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
