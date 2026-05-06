package com.turbodocx.models.quote;

import java.util.List;

/**
 * Request for the convenience createAndSend method.
 * Extends CreateQuoteRequest fields plus items, bundleItems, and send config.
 */
public class CreateAndSendRequest {
    // CreateQuoteRequest fields
    private String name;
    private String companyId;
    private String contactId;
    private Currency currency;
    private Integer termDays;
    private RenewalPeriod renewalPeriod;
    private String validUntil;
    private Double taxRate;
    private String priceBookId;

    // Additional fields for createAndSend
    private List<AddLineItemRequest> items;
    private List<AddBundleLineItemRequest> bundleItems;
    private SendQuoteRequest send;

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
    public List<AddLineItemRequest> getItems() { return items; }
    public void setItems(List<AddLineItemRequest> items) { this.items = items; }
    public List<AddBundleLineItemRequest> getBundleItems() { return bundleItems; }
    public void setBundleItems(List<AddBundleLineItemRequest> bundleItems) { this.bundleItems = bundleItems; }
    public SendQuoteRequest getSend() { return send; }
    public void setSend(SendQuoteRequest send) { this.send = send; }
}
