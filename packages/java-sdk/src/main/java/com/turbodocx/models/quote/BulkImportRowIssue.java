package com.turbodocx.models.quote;

/**
 * A per-row issue from a bulk create: the 1-indexed position of the row in the
 * request payload plus a human-readable reason.
 */
public class BulkImportRowIssue {
    private int row;
    private String reason;

    /** 1-indexed position of the row in the request payload. */
    public int getRow() { return row; }
    public String getReason() { return reason; }
}
