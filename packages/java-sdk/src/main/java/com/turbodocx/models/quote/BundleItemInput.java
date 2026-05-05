package com.turbodocx.models.quote;

/**
 * Input for bundle items in bundle create/update requests.
 */
public class BundleItemInput {
    private String productId;
    private Double unitPrice;
    private String billingFrequency;
    private Integer quantity;
    private Double discountPercent;
    private Double finalPrice;
    private Double cost;

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    public String getBillingFrequency() { return billingFrequency; }
    public void setBillingFrequency(String billingFrequency) { this.billingFrequency = billingFrequency; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    public Double getFinalPrice() { return finalPrice; }
    public void setFinalPrice(Double finalPrice) { this.finalPrice = finalPrice; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
}
