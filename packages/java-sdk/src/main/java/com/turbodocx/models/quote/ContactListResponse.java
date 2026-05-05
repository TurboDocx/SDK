package com.turbodocx.models.quote;

import java.util.List;

/**
 * Response from listing contacts (PaginatedResponse&lt;Contact&gt;).
 */
public class ContactListResponse {
    private List<Contact> results;
    private Integer totalRecords;

    public List<Contact> getResults() { return results; }
    public Integer getTotalRecords() { return totalRecords; }
}
