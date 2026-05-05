package com.turbodocx.models.quote;

import java.util.List;

/**
 * Request to send a quote with a document deliverable.
 */
public class SendQuoteWithDeliverableRequest {
    private String deliverableId;
    private String mergePosition;
    private List<String> ccEmails;

    public String getDeliverableId() { return deliverableId; }
    public void setDeliverableId(String deliverableId) { this.deliverableId = deliverableId; }
    public String getMergePosition() { return mergePosition; }
    public void setMergePosition(String mergePosition) { this.mergePosition = mergePosition; }
    public List<String> getCcEmails() { return ccEmails; }
    public void setCcEmails(List<String> ccEmails) { this.ccEmails = ccEmails; }
}
