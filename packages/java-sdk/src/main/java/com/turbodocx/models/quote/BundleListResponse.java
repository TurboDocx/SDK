package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing bundles — extends PaginatedResponse with stats.
 */
public class BundleListResponse {
    private List<Bundle> results;
    private Integer totalRecords;
    private Integer totalBundles;
    private Integer activeBundles;
    private Integer totalCategories;
    private Double catalogValue;

    public List<Bundle> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
    public Integer getTotalBundles() { return totalBundles; }
    public Integer getActiveBundles() { return activeBundles; }
    public Integer getTotalCategories() { return totalCategories; }
    public Double getCatalogValue() { return catalogValue; }
}
