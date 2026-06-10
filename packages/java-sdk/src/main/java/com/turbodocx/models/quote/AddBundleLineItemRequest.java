package com.turbodocx.models.quote;

/**
 * Request to add a bundle line item to a quote.
 */
public class AddBundleLineItemRequest {
    private String bundleId;
    private String bundleName;
    private Double quantity;
    private DiscountType discountType;
    private Double discountPercent;
    private Double discountAmount;
    private String bundleDescription;
    private Boolean showItemsToEndUser;

    public String getBundleId() { return bundleId; }
    public void setBundleId(String bundleId) { this.bundleId = bundleId; }
    public String getBundleName() { return bundleName; }
    public void setBundleName(String bundleName) { this.bundleName = bundleName; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public DiscountType getDiscountType() { return discountType; }
    public void setDiscountType(DiscountType discountType) { this.discountType = discountType; }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; }
    public String getBundleDescription() { return bundleDescription; }
    public void setBundleDescription(String bundleDescription) { this.bundleDescription = bundleDescription; }
    public Boolean getShowItemsToEndUser() { return showItemsToEndUser; }
    public void setShowItemsToEndUser(Boolean showItemsToEndUser) { this.showItemsToEndUser = showItemsToEndUser; }
}
