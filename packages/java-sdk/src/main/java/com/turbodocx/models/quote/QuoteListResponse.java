package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing quotes — extends PaginatedResponse with stats.
 */
public class QuoteListResponse {
    private List<Quote> results;
    private Integer totalRecords;
    private QuoteListStats stats;

    public List<Quote> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
    public QuoteListStats getStats() { return stats; }
}
