package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing types/categories (PaginatedResponse&lt;QuoteType&gt;).
 */
public class QuoteTypeListResponse {
    private List<QuoteType> results;
    private Integer totalRecords;

    public List<QuoteType> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
}
