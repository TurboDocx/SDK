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

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (categoryType != null) params.put("categoryType", categoryType.getValue());
        if (includeUsage != null) params.put("includeUsage", includeUsage.toString());
        return params.isEmpty() ? null : params;
    }
}
