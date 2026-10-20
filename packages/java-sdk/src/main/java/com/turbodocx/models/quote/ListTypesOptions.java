package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Options for listing types/categories.
 */
public class ListTypesOptions {
    private Integer limit;
    private Integer offset;
    private String query;
    private CategoryType categoryType;
    private Boolean includeUsage;
    /** Sort column: "name" or "usageCount" (usage needs a categoryType; default name, A to Z) */
    private String sortBy;
    /** "asc" or "desc" */
    private String sortDirection;

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public CategoryType getCategoryType() { return categoryType; }
    public void setCategoryType(CategoryType categoryType) { this.categoryType = categoryType; }
    public Boolean getIncludeUsage() { return includeUsage; }
    public void setIncludeUsage(Boolean includeUsage) { this.includeUsage = includeUsage; }

    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (categoryType != null) params.put("categoryType", categoryType.getValue());
        if (includeUsage != null) params.put("includeUsage", includeUsage.toString());
        if (sortBy != null) params.put("sortBy", sortBy);
        if (sortDirection != null) params.put("sortDirection", sortDirection);
        return params.isEmpty() ? null : params;
    }
}
