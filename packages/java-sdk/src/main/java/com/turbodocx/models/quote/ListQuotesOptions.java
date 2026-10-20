package com.turbodocx.models.quote;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Options for listing quotes with pagination, filters and sorting.
 *
 * <p>{@code statuses} also takes {@code "expired"}: a draft or sent quote past its Valid until
 * day (UTC), or whose signature expired. {@code companyId} / {@code currency} are the original
 * single filters; they merge with {@code companyIds} / {@code currencies}.</p>
 */
public class ListQuotesOptions {
    private Integer limit;
    private Integer offset;
    private String query;
    private List<String> statuses;
    private String companyId;
    private String contactId;
    private String currency;
    private List<String> companyIds;
    private List<String> currencies;
    /** User ids of the quotes' creators (see TurboQuote#listQuoteCreators) */
    private List<String> createdBy;
    /** Quotes created by any API key (ORed with createdBy) */
    private Boolean createdByApiKeys;
    /** "thisWeek", "thisMonth" or "past" (UTC days) */
    private String validUntilWindow;
    /** Inclusive YYYY-MM-DD bounds on Valid until */
    private String validUntilFrom;
    private String validUntilTo;
    /** "updatedOn", "createdOn", "total", "validUntil" or "quoteNumber" (default createdOn, newest first) */
    private String sortBy;
    /** "asc" or "desc" */
    private String sortDirection;
    /** Currency of the returned summary (default: the one filtered currency, else USD) */
    private String summaryCurrency;

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
    public List<String> getCompanyIds() { return companyIds; }
    public void setCompanyIds(List<String> companyIds) { this.companyIds = companyIds; }
    public List<String> getCurrencies() { return currencies; }
    public void setCurrencies(List<String> currencies) { this.currencies = currencies; }
    public List<String> getCreatedBy() { return createdBy; }
    public void setCreatedBy(List<String> createdBy) { this.createdBy = createdBy; }
    public Boolean getCreatedByApiKeys() { return createdByApiKeys; }
    public void setCreatedByApiKeys(Boolean createdByApiKeys) { this.createdByApiKeys = createdByApiKeys; }
    public String getValidUntilWindow() { return validUntilWindow; }
    public void setValidUntilWindow(String validUntilWindow) { this.validUntilWindow = validUntilWindow; }
    public String getValidUntilFrom() { return validUntilFrom; }
    public void setValidUntilFrom(String validUntilFrom) { this.validUntilFrom = validUntilFrom; }
    public String getValidUntilTo() { return validUntilTo; }
    public void setValidUntilTo(String validUntilTo) { this.validUntilTo = validUntilTo; }
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }
    public String getSummaryCurrency() { return summaryCurrency; }
    public void setSummaryCurrency(String summaryCurrency) { this.summaryCurrency = summaryCurrency; }

    /**
     * Convert to query parameter map for HTTP requests.
     */
    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (statuses != null) params.put("statuses", statuses);
        QueryParams.putQuoteFilters(params, query, companyId, companyIds, contactId, currency, currencies,
                createdBy, createdByApiKeys, validUntilWindow, validUntilFrom, validUntilTo, summaryCurrency);
        if (sortBy != null) params.put("sortBy", sortBy);
        if (sortDirection != null) params.put("sortDirection", sortDirection);
        return params.isEmpty() ? null : params;
    }
}
