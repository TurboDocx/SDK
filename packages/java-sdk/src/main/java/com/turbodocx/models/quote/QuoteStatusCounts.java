package com.turbodocx.models.quote;


/**
 * Quotes per quote list tab. Every list filter applies except the status filter, so each count is
 * what that tab would hold. {@code expired} overlaps {@code draft} and {@code sent}.
 */
public class QuoteStatusCounts {
    private int all;
    private int draft;
    private int sent;
    private int accepted;
    private int declined;
    private int voided;
    private int expired;

    public int getAll() { return all; }
    public int getDraft() { return draft; }
    public int getSent() { return sent; }
    public int getAccepted() { return accepted; }
    public int getDeclined() { return declined; }
    public int getVoided() { return voided; }
    public int getExpired() { return expired; }
}
