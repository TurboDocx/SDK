package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing quote templates.
 */
public class QuoteTemplateListResponse {
    private List<QuoteTemplate> results;
    private Integer totalRecords;

    public List<QuoteTemplate> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
}
