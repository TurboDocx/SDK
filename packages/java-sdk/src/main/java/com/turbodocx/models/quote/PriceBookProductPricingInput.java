package com.turbodocx.models.quote;

/**
 * Input for product pricing in price book create/update requests.
 */
public class PriceBookProductPricingInput {
    private String productId;
    private DiscountType discountType;
    private Double discountPercent;
    private Double discountAmount;
    private Double finalPrice;

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public DiscountType getDiscountType() { return discountType; }
    public void setDiscountType(DiscountType discountType) { this.discountType = discountType; }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; }
    public Double getFinalPrice() { return finalPrice; }
    public void setFinalPrice(Double finalPrice) { this.finalPrice = finalPrice; }
}
