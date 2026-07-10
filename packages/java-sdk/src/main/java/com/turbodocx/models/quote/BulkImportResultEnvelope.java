package com.turbodocx.models.quote;

/**
 * Envelope for the bulk-create endpoints.
 *
 * <p>After the HTTP client's smart-unwrap strips the outer {@code { "data": ... }},
 * the response is {@code { "results": { imported, failed, adjusted } }} — a single
 * object under {@code results} (not a list, unlike {@link ResultsEnvelope}).</p>
 */
public class BulkImportResultEnvelope {
    private BulkImportResult results;

    public BulkImportResult getResults() { return results; }
}
