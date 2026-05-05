package com.turbodocx.models.quote;

/**
 * Input for product pricing in price book create/update requests.
 */
public class PriceBookProductPricingInput {
    private String productId;
    private Double discountPercent;
    private Double finalPrice;

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    public Double getFinalPrice() { return finalPrice; }
    public void setFinalPrice(Double finalPrice) { this.finalPrice = finalPrice; }
}
