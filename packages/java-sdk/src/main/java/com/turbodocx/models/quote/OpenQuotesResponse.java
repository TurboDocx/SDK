package com.turbodocx.models.quote;

import java.util.List;

/**
 * The open quotes that block deleting a company or contact: the newest 50, and how many in all.
 */
public class OpenQuotesResponse {
    private List<OpenQuoteSummary> results;
    private Integer totalRecords;

    public List<OpenQuoteSummary> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
}
