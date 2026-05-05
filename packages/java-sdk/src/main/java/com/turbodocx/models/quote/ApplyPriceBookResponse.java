package com.turbodocx.models.quote;

/**
 * Response from applying a price book to a quote.
 */
public class ApplyPriceBookResponse {
    private Quote quote;
    private String message;
    private Integer updatedCount;
    private Integer skippedCount;

    public ApplyPriceBookResponse() {}

    public ApplyPriceBookResponse(Quote quote, String message, Integer updatedCount, Integer skippedCount) {
        this.quote = quote;
        this.message = message;
        this.updatedCount = updatedCount;
        this.skippedCount = skippedCount;
    }

    public Quote getQuote() { return quote; }
    public String getMessage() { return message; }
    public Integer getUpdatedCount() { return updatedCount; }
    public Integer getSkippedCount() { return skippedCount; }
}
