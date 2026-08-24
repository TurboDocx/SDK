package com.turbodocx.models.quote;

import com.turbodocx.models.SignatureSchedule;

import java.util.List;

/**
 * Request to send a quote with a document deliverable.
 */
public class SendQuoteWithDeliverableRequest {
    private String deliverableId;
    private String mergePosition;
    private List<String> ccEmails;
    private SignatureSchedule schedule;

    public String getDeliverableId() { return deliverableId; }
    public void setDeliverableId(String deliverableId) { this.deliverableId = deliverableId; }
    public String getMergePosition() { return mergePosition; }
    public void setMergePosition(String mergePosition) { this.mergePosition = mergePosition; }
    public List<String> getCcEmails() { return ccEmails; }
    public void setCcEmails(List<String> ccEmails) { this.ccEmails = ccEmails; }

    /**
     * Optional per-quote reminder/expiration schedule. The eight fields are sent flat on the
     * send body (see {@link SignatureSchedule}). Quote expiry is pinned to the quote's
     * {@code validUntil}, so {@code expireAfter} is ignored when expiration is on
     * ({@code expirationEnabled} still toggles it); the reminder/warning cadence must fit within
     * {@code validUntil}.
     */
    public SignatureSchedule getSchedule() { return schedule; }
    public void setSchedule(SignatureSchedule schedule) { this.schedule = schedule; }
}
