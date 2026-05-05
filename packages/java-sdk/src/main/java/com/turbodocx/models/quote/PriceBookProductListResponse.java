package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing price book products (PaginatedResponse&lt;PriceBookProductPricing&gt;).
 */
public class PriceBookProductListResponse {
    private List<PriceBookProductPricing> results;
    private Integer totalRecords;

    public List<PriceBookProductPricing> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
}
