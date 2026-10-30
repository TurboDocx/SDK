package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Options for listing contacts.
 */
public class ListContactsOptions {
    private Integer limit;
    private Integer offset;
    private String query;
    private String companyId;
    /** Several companies */
    private List<String> companyIds;
    /** Sort column: "name" or "createdOn" (default createdOn, newest first) */
    private String sortBy;
    /** "asc" or "desc" */
    private String sortDirection;

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public List<String> getCompanyIds() { return companyIds; }
    public void setCompanyIds(List<String> companyIds) { this.companyIds = companyIds; }
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (companyId != null) params.put("companyId", companyId);
        if (companyIds != null) params.put("companyIds", companyIds);
        if (sortBy != null) params.put("sortBy", sortBy);
        if (sortDirection != null) params.put("sortDirection", sortDirection);
        return params.isEmpty() ? null : params;
    }
}
