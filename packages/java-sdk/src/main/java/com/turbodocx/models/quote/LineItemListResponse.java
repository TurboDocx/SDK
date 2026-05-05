package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing line items (PaginatedResponse&lt;LineItem&gt;).
 */
public class LineItemListResponse {
    private List<LineItem> results;
    private Integer totalRecords;

    public List<LineItem> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
}
