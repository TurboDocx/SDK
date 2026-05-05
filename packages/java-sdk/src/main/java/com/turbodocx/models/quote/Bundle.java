package com.turbodocx.models.quote;

import java.util.List;

/**
 * Bundle domain entity.
 */
public class Bundle {
    private String id;
    private String orgId;
    private String name;
    private String description;
    private String sku;
    private String categoryId;
    private Double bundleDiscountPercent;
    private Double totalListPrice;
    private Double totalFinalPrice;
    private Double totalCost;
    private String currency;
    private Boolean showItemsToEndUser;
    private Boolean showInCatalog;
    private Boolean syncWithProducts;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private List<BundleItem> items;
    private BundleCategory category;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getSku() { return sku; }
    public String getCategoryId() { return categoryId; }
    public Double getBundleDiscountPercent() { return bundleDiscountPercent; }
    public Double getTotalListPrice() { return totalListPrice; }
    public Double getTotalFinalPrice() { return totalFinalPrice; }
    public Double getTotalCost() { return totalCost; }
    public String getCurrency() { return currency; }
    public Boolean getShowItemsToEndUser() { return showItemsToEndUser; }
    public Boolean getShowInCatalog() { return showInCatalog; }
    public Boolean getSyncWithProducts() { return syncWithProducts; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public List<BundleItem> getItems() { return items; }
    public BundleCategory getCategory() { return category; }

    /**
     * Nested bundle category reference.
     */
    public static class BundleCategory {
        private String id;
        private String name;
        private String categoryType;

        public String getId() { return id; }
        public String getName() { return name; }
        public String getCategoryType() { return categoryType; }
    }
}
