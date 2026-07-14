package com.turbodocx.models.quote;

/**
 * Request to create a new quote. {@code name}, {@code companyId} and {@code contactId}
 * are required.
 */
public class CreateQuoteRequest {
    private String name;
    private String companyId;
    private String contactId;
    private Currency currency;
    /** Defaults to 60 when unset. Maximum 3650 (10 years). {@code -1} means auto-renewal. */
    private Integer termDays;
    /**
     * Required if and only if {@code termDays} is {@code -1} (auto-renewal).
     * For any other {@code termDays} it must be left null -- sending it is a 400.
     */
    private RenewalPeriod renewalPeriod;
    private String validUntil;
    private Double taxRate;
    private String priceBookId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }
    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }
    public Currency getCurrency() { return currency; }
    public void setCurrency(Currency currency) { this.currency = currency; }
    public Integer getTermDays() { return termDays; }
    public void setTermDays(Integer termDays) { this.termDays = termDays; }
    public RenewalPeriod getRenewalPeriod() { return renewalPeriod; }
    public void setRenewalPeriod(RenewalPeriod renewalPeriod) { this.renewalPeriod = renewalPeriod; }
    public String getValidUntil() { return validUntil; }
    public void setValidUntil(String validUntil) { this.validUntil = validUntil; }
    public Double getTaxRate() { return taxRate; }
    public void setTaxRate(Double taxRate) { this.taxRate = taxRate; }
    public String getPriceBookId() { return priceBookId; }
    public void setPriceBookId(String priceBookId) { this.priceBookId = priceBookId; }
}
