package com.turbodocx.models.quote;

/**
 * Request to update an existing line item.
 */
public class UpdateLineItemRequest extends TrackableRequest {
    private Double quantity;
    private Double unitPrice;
    private DiscountType discountType;
    private Double discountPercent;
    private Double discountAmount;
    private String billingFrequency;
    private String categoryId;
    private String categoryName;
    private Double cost;
    private Boolean showItemsToEndUser;
    private String productName;
    private String productSku;
    private String productDescription;
    private Integer displayOrder;

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; markFieldSet("quantity"); }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; markFieldSet("unitPrice"); }
    public DiscountType getDiscountType() { return discountType; }
    public void setDiscountType(DiscountType discountType) { this.discountType = discountType; markFieldSet("discountType"); }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; markFieldSet("discountPercent"); }
    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; markFieldSet("discountAmount"); }
    public String getBillingFrequency() { return billingFrequency; }
    public void setBillingFrequency(String billingFrequency) { this.billingFrequency = billingFrequency; markFieldSet("billingFrequency"); }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; markFieldSet("categoryId"); }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; markFieldSet("categoryName"); }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; markFieldSet("cost"); }
    public Boolean getShowItemsToEndUser() { return showItemsToEndUser; }
    public void setShowItemsToEndUser(Boolean showItemsToEndUser) { this.showItemsToEndUser = showItemsToEndUser; markFieldSet("showItemsToEndUser"); }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; markFieldSet("productName"); }
    public String getProductSku() { return productSku; }
    public void setProductSku(String productSku) { this.productSku = productSku; markFieldSet("productSku"); }
    public String getProductDescription() { return productDescription; }
    public void setProductDescription(String productDescription) { this.productDescription = productDescription; markFieldSet("productDescription"); }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; markFieldSet("displayOrder"); }
}
