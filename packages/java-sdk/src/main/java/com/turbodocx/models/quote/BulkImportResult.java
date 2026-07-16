package com.turbodocx.models.quote;

import java.util.List;

/**
 * Outcome of a bulk create. Rows process sequentially with partial success:
 * {@code failed} rows did not import (no exception is thrown for them) and
 * {@code adjusted} rows imported with a server-side adjustment (e.g. a bundle
 * item whose product wasn't found was dropped).
 */
public class BulkImportResult {
    private int imported;
    private List<BulkImportRowIssue> failed;
    private List<BulkImportRowIssue> adjusted;

    /** Number of rows successfully imported. */
    public int getImported() { return imported; }
    /** Rows that did not import, with 1-indexed row and reason. */
    public List<BulkImportRowIssue> getFailed() { return failed; }
    /** Rows that imported with a server-side adjustment, with 1-indexed row and reason. */
    public List<BulkImportRowIssue> getAdjusted() { return adjusted; }
}
