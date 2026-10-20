package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Search, sort and pagination for one company's contacts (TurboQuote#listCompanyContacts).
 */
public class ListCompanyContactsOptions extends PaginationParams {
    /** "name" or "createdOn" (default createdOn, newest first) */
    private String sortBy;
    /** "asc" or "desc" */
    private String sortDirection;

    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }

    @Override
    public Map<String, Object> toQueryParams() {
        Map<String, Object> base = super.toQueryParams();
        Map<String, Object> params = base != null ? base : new LinkedHashMap<>();
        if (sortBy != null) params.put("sortBy", sortBy);
        if (sortDirection != null) params.put("sortDirection", sortDirection);
        return params.isEmpty() ? null : params;
    }
}
