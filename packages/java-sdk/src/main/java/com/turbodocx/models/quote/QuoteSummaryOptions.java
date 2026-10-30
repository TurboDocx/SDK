package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Filters for TurboQuote#getQuoteSummary — the same filters as listing quotes (the status filter
 * is ignored by the summary), plus the currency the summary is in.
 */
public class QuoteSummaryOptions {
    private String query;
    private String companyId;
    private List<String> companyIds;
    private String contactId;
    private String currency;
    private List<String> currencies;
    private List<String> createdBy;
    private Boolean createdByApiKeys;
    private String validUntilWindow;
    private String validUntilFrom;
    private String validUntilTo;
    private String summaryCurrency;

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public List<String> getCompanyIds() { return companyIds; }
    public void setCompanyIds(List<String> companyIds) { this.companyIds = companyIds; }
    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
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
    public String getSummaryCurrency() { return summaryCurrency; }
    public void setSummaryCurrency(String summaryCurrency) { this.summaryCurrency = summaryCurrency; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        QueryParams.putQuoteFilters(params, query, companyId, companyIds, contactId, currency, currencies,
                createdBy, createdByApiKeys, validUntilWindow, validUntilFrom, validUntilTo, summaryCurrency);
        return params.isEmpty() ? null : params;
    }
}
