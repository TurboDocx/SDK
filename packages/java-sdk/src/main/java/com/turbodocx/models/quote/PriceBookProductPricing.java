package com.turbodocx.models.quote;

/**
 * Price book product pricing entry.
 */
public class PriceBookProductPricing {
    private String id;
    private String priceBookId;
    private String productId;
    private Double discountPercent;
    private Double finalPrice;
    private String orgId;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private Product product;

    public String getId() { return id; }
    public String getPriceBookId() { return priceBookId; }
    public String getProductId() { return productId; }
    public Double getDiscountPercent() { return discountPercent; }
    public Double getFinalPrice() { return finalPrice; }
    public String getOrgId() { return orgId; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public Product getProduct() { return product; }
}
