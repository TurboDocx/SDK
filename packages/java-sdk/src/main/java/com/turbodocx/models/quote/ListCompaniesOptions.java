package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Options for listing companies.
 */
public class ListCompaniesOptions {
    private Integer limit;
    private Integer offset;
    private String query;
    private List<String> industryIds;

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public List<String> getIndustryIds() { return industryIds; }
    public void setIndustryIds(List<String> industryIds) { this.industryIds = industryIds; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (industryIds != null) params.put("industryIds", industryIds);
        return params.isEmpty() ? null : params;
    }
}
