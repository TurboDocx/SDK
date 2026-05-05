package com.turbodocx.models.quote;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Options for listing quotes with pagination and filters.
 */
public class ListQuotesOptions {
    private Integer limit;
    private Integer offset;
    private String query;
    private List<String> statuses;
    private String companyId;
    private String contactId;
    private String currency;

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public List<String> getStatuses() { return statuses; }
    public void setStatuses(List<String> statuses) { this.statuses = statuses; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    /**
     * Convert to query parameter map for HTTP requests.
     */
    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (statuses != null) params.put("statuses", statuses);
        if (companyId != null) params.put("companyId", companyId);
        if (contactId != null) params.put("contactId", contactId);
        if (currency != null) params.put("currency", currency);
        return params.isEmpty() ? null : params;
    }
}
