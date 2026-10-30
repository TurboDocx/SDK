package com.turbodocx.models.quote;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Helpers shared by the list option classes.
 */
final class QueryParams {
    private QueryParams() {}

    /**
     * One value and several values for the same query param, merged into one list (sent as
     * repeated keys). Null when neither is set.
     */
    static List<String> oneOrMany(String one, List<String> many) {
        if (one == null && (many == null || many.isEmpty())) return null;
        List<String> values = new ArrayList<>();
        if (one != null) values.add(one);
        if (many != null) values.addAll(many);
        return values;
    }

    /**
     * Puts the quote list filters shared by listQuotes and getQuoteSummary.
     */
    static void putQuoteFilters(Map<String, Object> params, String query, String companyId, List<String> companyIds,
                                String contactId, String currency, List<String> currencies, List<String> createdBy,
                                Boolean createdByApiKeys, String validUntilWindow, String validUntilFrom,
                                String validUntilTo, String summaryCurrency) {
        if (query != null) params.put("query", query);
        if (companyId != null) params.put("companyId", companyId);
        if (companyIds != null) params.put("companyIds", companyIds);
        if (contactId != null) params.put("contactId", contactId);
        if (currency != null) params.put("currency", currency);
        if (currencies != null) params.put("currencies", currencies);
        if (createdBy != null) params.put("createdBy", createdBy);
        if (createdByApiKeys != null) params.put("createdByApiKeys", createdByApiKeys.toString());
        if (validUntilWindow != null) params.put("validUntilWindow", validUntilWindow);
        if (validUntilFrom != null) params.put("validUntilFrom", validUntilFrom);
        if (validUntilTo != null) params.put("validUntilTo", validUntilTo);
        if (summaryCurrency != null) params.put("summaryCurrency", summaryCurrency);
    }
}
