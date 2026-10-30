package com.turbodocx.models.quote;

/**
 * The number the next new quote will get (TurboQuote#getNextQuoteNumber). Read only: the counter
 * doesn't move, so a quote created by someone else in between takes it first.
 */
public class NextQuoteNumber {
    private String nextNumber;
    private Integer sequence;
    /** Whether the caller can change numbering (administrators) */
    private Boolean canEdit;

    public String getNextNumber() { return nextNumber; }
    public Integer getSequence() { return sequence; }
    public Boolean getCanEdit() { return canEdit; }
}
