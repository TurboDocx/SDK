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
    /** Several currencies, sent as repeated "currency" params (merged with currency) */
    private List<String> currencies;
    /** Sort column: "name", "itemCount", "totalListPrice", "totalFinalPrice" or "createdOn" (default createdOn, newest first) */
    private String sortBy;
    /** "asc" or "desc" */
    private String sortDirection;

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

    public List<String> getCurrencies() { return currencies; }
    public void setCurrencies(List<String> currencies) { this.currencies = currencies; }
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (categoryIds != null) params.put("categoryIds", categoryIds);
        List<String> currencyList = QueryParams.oneOrMany(currency, currencies);
        if (currencyList != null) params.put("currency", currencyList);
        if (showInCatalog != null) params.put("showInCatalog", showInCatalog.toString());
        if (sortBy != null) params.put("sortBy", sortBy);
        if (sortDirection != null) params.put("sortDirection", sortDirection);
        return params.isEmpty() ? null : params;
    }
}
