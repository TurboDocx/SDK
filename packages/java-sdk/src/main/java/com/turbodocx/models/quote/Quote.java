package com.turbodocx.models.quote;

import java.util.List;

/**
 * Quote domain entity.
 */
public class Quote {
    private String id;
    private String orgId;
    private String quoteNumber;
    private String name;
    private String status;
    private String companyId;
    private String contactId;
    private String priceBookId;
    private Integer termDays;
    private RenewalPeriod renewalPeriod;
    private String sentAt;
    private String validUntil;
    private Double taxRate;
    private Currency currency;
    private Double subtotalMonthly;
    private Double subtotalQuarterly;
    private Double subtotalAnnual;
    private Double subtotalOneTime;
    private Double taxAmount;
    private Double grandTotal;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private Company company;
    private Contact contact;
    private List<LineItem> lineItems;
    private PriceBook priceBook;
    private QuoteCreator creator;
    private QuoteStatusInfo statusInfo;
    private QuotePreparedBy preparedBy;
    /** listQuotes only: how many line items the quote has */
    private Integer lineItemCount;
    /** listQuotes only: the quote's signature request has expired */
    private Boolean isSignatureExpired;
    /**
     * listQuotes only: a draft or sent quote past its Valid until day (UTC), or whose signature
     * expired. The same rule as the "expired" status filter.
     */
    private Boolean isExpired;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getQuoteNumber() { return quoteNumber; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    public String getCompanyId() { return companyId; }
    public String getContactId() { return contactId; }
    public String getPriceBookId() { return priceBookId; }
    public Integer getTermDays() { return termDays; }
    public RenewalPeriod getRenewalPeriod() { return renewalPeriod; }
    public String getSentAt() { return sentAt; }
    public String getValidUntil() { return validUntil; }
    public Double getTaxRate() { return taxRate; }
    public Currency getCurrency() { return currency; }
    public Double getSubtotalMonthly() { return subtotalMonthly; }
    public Double getSubtotalQuarterly() { return subtotalQuarterly; }
    public Double getSubtotalAnnual() { return subtotalAnnual; }
    public Double getSubtotalOneTime() { return subtotalOneTime; }
    public Double getTaxAmount() { return taxAmount; }
    public Double getGrandTotal() { return grandTotal; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public Company getCompany() { return company; }
    public Contact getContact() { return contact; }
    public List<LineItem> getLineItems() { return lineItems; }
    public PriceBook getPriceBook() { return priceBook; }
    public QuoteCreator getCreator() { return creator; }
    public QuoteStatusInfo getStatusInfo() { return statusInfo; }

    /**
     * The resolved "Prepared by" identity shown on the quote PDF and preview. Resolved
     * server-side from the org template then the creator; for an API-key-created quote it is
     * the API key's label with no email. Prefer over {@link #getCreator()} for customer-facing
     * display — the creator may be the internal API service account.
     */
    public QuotePreparedBy getPreparedBy() { return preparedBy; }

    public void setStatusInfo(QuoteStatusInfo statusInfo) { this.statusInfo = statusInfo; }

    public void setPreparedBy(QuotePreparedBy preparedBy) { this.preparedBy = preparedBy; }

    public Integer getLineItemCount() { return lineItemCount; }
    public Boolean getIsSignatureExpired() { return isSignatureExpired; }
    public Boolean getIsExpired() { return isExpired; }

    /**
     * Nested creator type. Also what TurboQuote#listQuoteCreators returns: there {@code name},
     * {@code email}, {@code isAPIKey} and {@code apiKeyDeleted} are set instead of the first and
     * last name, and {@code id} is the value for the {@code createdBy} filter.
     */
    public static class QuoteCreator {
        private String id;
        private String firstName;
        private String lastName;
        /** A person's name (else email), or the API key's name */
        private String name;
        /** Null for an API key */
        private String email;
        private Boolean isAPIKey;
        /** An API key that has since been deleted (its quotes stay) */
        private Boolean apiKeyDeleted;

        public String getId() { return id; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public Boolean getIsAPIKey() { return isAPIKey; }
        public Boolean getApiKeyDeleted() { return apiKeyDeleted; }
    }

    /**
     * Nested "Prepared by" type. Both fields may be null (an API-created quote whose org
     * template has no sender email resolves to a name with no email).
     */
    public static class QuotePreparedBy {
        private String name;
        private String email;

        public String getName() { return name; }
        public String getEmail() { return email; }
    }
}
