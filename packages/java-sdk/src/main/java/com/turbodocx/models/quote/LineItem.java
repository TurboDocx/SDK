package com.turbodocx.models.quote;

import java.util.List;

/**
 * Line item domain entity.
 */
public class LineItem {
    private String id;
    private String orgId;
    private String quoteId;
    private String lineItemType;
    private String parentLineItemId;
    private String productId;
    private String productName;
    private String productSku;
    private String productDescription;
    private String bundleId;
    private String bundleName;
    private String bundleDescription;
    private Integer quantity;
    private Double unitPrice;
    private Double discountPercent;
    private Double subtotal;
    private Double cost;
    private Double marginPercent;
    private String categoryId;
    private String categoryName;
    private String billingFrequency;
    private Boolean showItemsToEndUser;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private Product product;
    private List<LineItem> childLineItems;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getQuoteId() { return quoteId; }
    public String getLineItemType() { return lineItemType; }
    public String getParentLineItemId() { return parentLineItemId; }
    public String getProductId() { return productId; }
    public String getProductName() { return productName; }
    public String getProductSku() { return productSku; }
    public String getProductDescription() { return productDescription; }
    public String getBundleId() { return bundleId; }
    public String getBundleName() { return bundleName; }
    public String getBundleDescription() { return bundleDescription; }
    public Integer getQuantity() { return quantity; }
    public Double getUnitPrice() { return unitPrice; }
    public Double getDiscountPercent() { return discountPercent; }
    public Double getSubtotal() { return subtotal; }
    public Double getCost() { return cost; }
    public Double getMarginPercent() { return marginPercent; }
    public String getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public String getBillingFrequency() { return billingFrequency; }
    public Boolean getShowItemsToEndUser() { return showItemsToEndUser; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public Product getProduct() { return product; }
    public List<LineItem> getChildLineItems() { return childLineItems; }
}
