package com.turbodocx.models.quote;

/**
 * Response from sending a quote with a deliverable.
 */
public class SendQuoteWithDeliverableResponse {
    private Quote quote;
    private String message;
    private String documentId;

    public SendQuoteWithDeliverableResponse() {}

    public SendQuoteWithDeliverableResponse(Quote quote, String message, String documentId) {
        this.quote = quote;
        this.message = message;
        this.documentId = documentId;
    }

    public Quote getQuote() { return quote; }
    public String getMessage() { return message; }
    public String getDocumentId() { return documentId; }
}
