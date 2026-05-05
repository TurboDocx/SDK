package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Generic pagination parameters.
 */
public class PaginationParams {
    private Integer limit;
    private Integer offset;
    private String query;

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        return params.isEmpty() ? null : params;
    }
}
