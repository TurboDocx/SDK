package com.turbodocx.models.quote;

/**
 * An open quote (draft, pending approval or sent) for a company or contact.
 */
public class OpenQuoteSummary {
    private String id;
    private String quoteNumber;
    private String name;
    private String status;
    private String updatedOn;

    public String getId() { return id; }
    public String getQuoteNumber() { return quoteNumber; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    public String getUpdatedOn() { return updatedOn; }
}
