package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Options for listing price books.
 */
public class ListPriceBooksOptions {
    private Integer limit;
    private Integer offset;
    private String query;
    private List<String> priceBookTypeIds;
    private Boolean showInQuoteBuilder;
    /** Sort column: "name", "discountPercent", "overrideCount", "validFrom", "validTo" or "createdOn" (default createdOn, newest first) */
    private String sortBy;
    /** "asc" or "desc" */
    private String sortDirection;

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public List<String> getPriceBookTypeIds() { return priceBookTypeIds; }
    public void setPriceBookTypeIds(List<String> priceBookTypeIds) { this.priceBookTypeIds = priceBookTypeIds; }
    public Boolean getShowInQuoteBuilder() { return showInQuoteBuilder; }
    public void setShowInQuoteBuilder(Boolean showInQuoteBuilder) { this.showInQuoteBuilder = showInQuoteBuilder; }

    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (priceBookTypeIds != null) params.put("priceBookTypeIds", priceBookTypeIds);
        if (showInQuoteBuilder != null) params.put("showInQuoteBuilder", showInQuoteBuilder.toString());
        if (sortBy != null) params.put("sortBy", sortBy);
        if (sortDirection != null) params.put("sortDirection", sortDirection);
        return params.isEmpty() ? null : params;
    }
}
