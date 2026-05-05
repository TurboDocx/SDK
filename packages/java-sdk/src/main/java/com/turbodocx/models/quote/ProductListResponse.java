package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing products — extends PaginatedResponse with stats.
 */
public class ProductListResponse {
    private List<Product> results;
    private Integer totalRecords;
    private Integer totalProducts;
    private Integer activeProducts;
    private Integer totalCategories;
    private Double catalogValue;

    public List<Product> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
    public Integer getTotalProducts() { return totalProducts; }
    public Integer getActiveProducts() { return activeProducts; }
    public Integer getTotalCategories() { return totalCategories; }
    public Double getCatalogValue() { return catalogValue; }
}
