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
    private String renewalPeriod;
    private String sentAt;
    private String validUntil;
    private Double taxRate;
    private String currency;
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

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getQuoteNumber() { return quoteNumber; }
    public String getName() { return name; }
    public String getStatus() { return status; }
    public String getCompanyId() { return companyId; }
    public String getContactId() { return contactId; }
    public String getPriceBookId() { return priceBookId; }
    public Integer getTermDays() { return termDays; }
    public String getRenewalPeriod() { return renewalPeriod; }
    public String getSentAt() { return sentAt; }
    public String getValidUntil() { return validUntil; }
    public Double getTaxRate() { return taxRate; }
    public String getCurrency() { return currency; }
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

    public void setStatusInfo(QuoteStatusInfo statusInfo) { this.statusInfo = statusInfo; }

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
}
