package com.turbodocx.models.quote;

/**
 * Response from the createAndSend convenience method.
 */
public class CreateAndSendResponse {
    private Quote quote;

    public CreateAndSendResponse() {}

    public CreateAndSendResponse(Quote quote) {
        this.quote = quote;
    }

    public Quote getQuote() { return quote; }
}
