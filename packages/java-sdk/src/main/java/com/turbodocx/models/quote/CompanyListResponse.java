package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing companies (PaginatedResponse&lt;Company&gt;).
 */
public class CompanyListResponse {
    private List<Company> results;
    private Integer totalRecords;

    public List<Company> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
}
