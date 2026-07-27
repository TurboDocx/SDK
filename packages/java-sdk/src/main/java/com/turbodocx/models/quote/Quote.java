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

    /**
     * Nested creator type.
     */
    public static class QuoteCreator {
        private String id;
        private String firstName;
        private String lastName;

        public String getId() { return id; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
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
