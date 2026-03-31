package com.turbodocx.models.deliverable;

import java.util.List;

public class DeliverableListResponse {
    private List<DeliverableRecord> results;
    private int totalRecords;

    public List<DeliverableRecord> getResults() { return results; }
    public int getTotalRecords() { return totalRecords; }
}
