package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing quotes — extends PaginatedResponse with stats.
 */
public class QuoteListResponse {
    private List<Quote> results;
    private Integer totalRecords;
    private QuoteListStats stats;
    /** Quotes per list tab (every filter except the status filter) */
    private QuoteStatusCounts statusCounts;
    /** The list's summary cards, in one currency */
    private QuoteSummary summary;

    public List<Quote> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
    public QuoteListStats getStats() { return stats; }
    public QuoteStatusCounts getStatusCounts() { return statusCounts; }
    public QuoteSummary getSummary() { return summary; }
}
