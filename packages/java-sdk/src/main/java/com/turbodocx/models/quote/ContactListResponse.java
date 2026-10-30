package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing contacts (PaginatedResponse&lt;Contact&gt;).
 */
public class ContactListResponse {
    private List<Contact> results;
    private Integer totalRecords;
    /**
     * The company, when the list is for one company. Its contactCount is the company's active
     * contacts whatever the search (a company can't lose its last contact).
     */
    private Company company;

    public List<Contact> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
    public Company getCompany() { return company; }
}
