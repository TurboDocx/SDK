package com.turbodocx.models.quote;

import java.util.List;

/**
 * Product domain entity.
 */
public class Product {
    private String id;
    private String orgId;
    private String name;
    private String sku;
    private String description;
    private String detailedSpecification;
    private String internalNotes;
    private String categoryId;
    private Double listPrice;
    private Double cost;
    private Integer minimumOrderQuantity;
    private String billingFrequency;
    private String currency;
    private Boolean showInCatalog;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private List<ProductImage> images;
    private ProductCategory category;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getName() { return name; }
    public String getSku() { return sku; }
    public String getDescription() { return description; }
    public String getDetailedSpecification() { return detailedSpecification; }
    public String getInternalNotes() { return internalNotes; }
    public String getCategoryId() { return categoryId; }
    public Double getListPrice() { return listPrice; }
    public Double getCost() { return cost; }
    public Integer getMinimumOrderQuantity() { return minimumOrderQuantity; }
    public String getBillingFrequency() { return billingFrequency; }
    public String getCurrency() { return currency; }
    public Boolean getShowInCatalog() { return showInCatalog; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public List<ProductImage> getImages() { return images; }
    public ProductCategory getCategory() { return category; }

    /**
     * Nested product category reference.
     */
    public static class ProductCategory {
        private String id;
        private String name;
        private String categoryType;

        public String getId() { return id; }
        public String getName() { return name; }
        public String getCategoryType() { return categoryType; }
    }
}
