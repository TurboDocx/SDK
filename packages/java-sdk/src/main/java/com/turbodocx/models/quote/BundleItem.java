package com.turbodocx.models.quote;

/**
 * Bundle item entity.
 */
public class BundleItem {
    private String id;
    private String orgId;
    private String bundleId;
    private String productId;
    private Double quantity;
    private Double unitPrice;
    private Double discountPercent;
    private Double finalPrice;
    private Double cost;
    private String billingFrequency;
    private String itemStatus;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private Product product;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getBundleId() { return bundleId; }
    public String getProductId() { return productId; }
    public Double getQuantity() { return quantity; }
    public Double getUnitPrice() { return unitPrice; }
    public Double getDiscountPercent() { return discountPercent; }
    public Double getFinalPrice() { return finalPrice; }
    public Double getCost() { return cost; }
    public String getBillingFrequency() { return billingFrequency; }
    public String getItemStatus() { return itemStatus; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public Product getProduct() { return product; }
}
