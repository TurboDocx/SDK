package com.turbodocx.models.quote;

/**
 * Request to add a product line item to a quote.
 *
 * <p>{@code productId}, {@code productName}, {@code unitPrice} and
 * {@code billingFrequency} are all required. {@code productId} is unusual: the backend
 * requires the KEY to be present but allows the VALUE to be null (an ad-hoc line item).
 * {@code TurboQuote.addLineItems} emits {@code productId: null} explicitly, so leaving it
 * unset is safe.
 */
public class AddLineItemRequest {
    /** Required key; catalog product UUID. May be null for an ad-hoc line item. */
    private String productId;
    /** Required. */
    private String productName;
    /** Required. */
    private Double unitPrice;
    /** Required. */
    private String billingFrequency;
    /** Defaults to 1 when unset. */
    private Double quantity;
    private DiscountType discountType;
    private Double discountPercent;
    private Double discountAmount;
    private String categoryId;
    private String categoryName;
    private Double cost;
    private String productSku;
    private String productDescription;

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    public String getBillingFrequency() { return billingFrequency; }
    public void setBillingFrequency(String billingFrequency) { this.billingFrequency = billingFrequency; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public DiscountType getDiscountType() { return discountType; }
    public void setDiscountType(DiscountType discountType) { this.discountType = discountType; }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    public String getProductSku() { return productSku; }
    public void setProductSku(String productSku) { this.productSku = productSku; }
    public String getProductDescription() { return productDescription; }
    public void setProductDescription(String productDescription) { this.productDescription = productDescription; }
}
