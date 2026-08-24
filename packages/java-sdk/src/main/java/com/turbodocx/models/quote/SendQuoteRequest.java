package com.turbodocx.models.quote;

import com.turbodocx.models.SignatureSchedule;

import java.util.List;

/**
 * Request to send a quote.
 */
public class SendQuoteRequest {
    private List<String> ccEmails;
    private String validUntil;
    private SignatureSchedule schedule;

    public List<String> getCcEmails() { return ccEmails; }
    public void setCcEmails(List<String> ccEmails) { this.ccEmails = ccEmails; }
    public String getValidUntil() { return validUntil; }
    public void setValidUntil(String validUntil) { this.validUntil = validUntil; }

    /**
     * Optional per-quote reminder/expiration schedule. The eight fields are sent flat on the
     * send body (see {@link SignatureSchedule}). Quote expiry is pinned to {@code validUntil}, so
     * {@code expireAfter} is ignored when expiration is on ({@code expirationEnabled} still
     * toggles it); the reminder/warning cadence must fit within {@code validUntil}.
     */
    public SignatureSchedule getSchedule() { return schedule; }
    public void setSchedule(SignatureSchedule schedule) { this.schedule = schedule; }
}
