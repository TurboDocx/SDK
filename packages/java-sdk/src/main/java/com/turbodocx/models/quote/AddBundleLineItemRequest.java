package com.turbodocx.models.quote;

/**
 * Request to add a bundle line item to a quote.
 */
public class AddBundleLineItemRequest {
    private String bundleId;
    private String bundleName;
    private Integer quantity;
    private Double discountPercent;
    private String bundleDescription;
    private Boolean showItemsToEndUser;

    public String getBundleId() { return bundleId; }
    public void setBundleId(String bundleId) { this.bundleId = bundleId; }
    public String getBundleName() { return bundleName; }
    public void setBundleName(String bundleName) { this.bundleName = bundleName; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    public String getBundleDescription() { return bundleDescription; }
    public void setBundleDescription(String bundleDescription) { this.bundleDescription = bundleDescription; }
    public Boolean getShowItemsToEndUser() { return showItemsToEndUser; }
    public void setShowItemsToEndUser(Boolean showItemsToEndUser) { this.showItemsToEndUser = showItemsToEndUser; }
}
