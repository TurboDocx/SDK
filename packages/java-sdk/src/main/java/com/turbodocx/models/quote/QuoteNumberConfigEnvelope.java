package com.turbodocx.models.quote;

/**
 * Envelope for the quote-number-config endpoints.
 *
 * <p>After the HTTP client's smart-unwrap strips the outer {@code { "data": ... }},
 * both GET and PATCH return {@code { "results": { format, currentFloor } }} — a single
 * object under {@code results} (not a list, unlike {@link ResultsEnvelope}).</p>
 */
public class QuoteNumberConfigEnvelope {
    private QuoteNumberConfig results;

    public QuoteNumberConfig getResults() { return results; }
}
