package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing price books — extends PaginatedResponse with stats.
 */
public class PriceBookListResponse {
    private List<PriceBook> results;
    private Integer totalRecords;
    private Integer totalPriceBooks;
    private Integer activeInBuilder;
    private Integer totalProducts;
    private String defaultPriceBookName;

    public List<PriceBook> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
    public Integer getTotalPriceBooks() { return totalPriceBooks; }
    public Integer getActiveInBuilder() { return activeInBuilder; }
    public Integer getTotalProducts() { return totalProducts; }
    public String getDefaultPriceBookName() { return defaultPriceBookName; }
}
