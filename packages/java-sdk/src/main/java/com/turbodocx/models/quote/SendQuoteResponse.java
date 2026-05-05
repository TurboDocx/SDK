package com.turbodocx.models.quote;

/**
 * Response from sending a quote.
 */
public class SendQuoteResponse {
    private Quote quote;
    private String message;

    public SendQuoteResponse() {}

    public SendQuoteResponse(Quote quote, String message) {
        this.quote = quote;
        this.message = message;
    }

    public Quote getQuote() { return quote; }
    public String getMessage() { return message; }
}
