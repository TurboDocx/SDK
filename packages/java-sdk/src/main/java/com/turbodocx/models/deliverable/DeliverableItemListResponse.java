package com.turbodocx.models.deliverable;

import java.util.List;

public class DeliverableItemListResponse {
    private List<DeliverableItem> results;
    private int totalRecords;

    public List<DeliverableItem> getResults() { return results; }
    public int getTotalRecords() { return totalRecords; }
}
