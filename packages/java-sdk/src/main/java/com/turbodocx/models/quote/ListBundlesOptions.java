package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Options for listing bundles.
 */
public class ListBundlesOptions {
    private Integer limit;
    private Integer offset;
    private String query;
    private List<String> categoryIds;
    private String currency;
    private Boolean showInCatalog;

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public List<String> getCategoryIds() { return categoryIds; }
    public void setCategoryIds(List<String> categoryIds) { this.categoryIds = categoryIds; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Boolean getShowInCatalog() { return showInCatalog; }
    public void setShowInCatalog(Boolean showInCatalog) { this.showInCatalog = showInCatalog; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (categoryIds != null) params.put("categoryIds", categoryIds);
        if (currency != null) params.put("currency", currency);
        if (showInCatalog != null) params.put("showInCatalog", showInCatalog.toString());
        return params.isEmpty() ? null : params;
    }
}
