package com.turbodocx.models.quote;

/**
 * Request to update an existing quote.
 */
public class UpdateQuoteRequest extends TrackableRequest {
    private String name;
    private String companyId;
    private String contactId;
    private Integer termDays;
    private RenewalPeriod renewalPeriod;
    private String validUntil;
    private Double taxRate;
    private Currency currency;
    private String priceBookId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; markFieldSet("name"); }
    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; markFieldSet("companyId"); }
    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; markFieldSet("contactId"); }
    public Integer getTermDays() { return termDays; }
    public void setTermDays(Integer termDays) { this.termDays = termDays; markFieldSet("termDays"); }
    public RenewalPeriod getRenewalPeriod() { return renewalPeriod; }
    public void setRenewalPeriod(RenewalPeriod renewalPeriod) { this.renewalPeriod = renewalPeriod; markFieldSet("renewalPeriod"); }
    public String getValidUntil() { return validUntil; }
    public void setValidUntil(String validUntil) { this.validUntil = validUntil; markFieldSet("validUntil"); }
    public Double getTaxRate() { return taxRate; }
    public void setTaxRate(Double taxRate) { this.taxRate = taxRate; markFieldSet("taxRate"); }
    public Currency getCurrency() { return currency; }
    public void setCurrency(Currency currency) { this.currency = currency; markFieldSet("currency"); }
    public String getPriceBookId() { return priceBookId; }
    public void setPriceBookId(String priceBookId) { this.priceBookId = priceBookId; markFieldSet("priceBookId"); }
}
