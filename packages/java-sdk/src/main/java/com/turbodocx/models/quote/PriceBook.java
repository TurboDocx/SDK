package com.turbodocx.models.quote;

import java.util.List;

/**
 * Price book domain entity.
 */
public class PriceBook {
    private String id;
    private String orgId;
    private String name;
    private String description;
    private String priceBookTypeId;
    private Double discountPercent;
    private String validFrom;
    private String validTo;
    private Boolean isDefault;
    private Boolean showInQuoteBuilder;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private List<PriceBookProductPricing> productPricing;
    private PriceBookType priceBookType;
    private Integer productCount;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getPriceBookTypeId() { return priceBookTypeId; }
    public Double getDiscountPercent() { return discountPercent; }
    public String getValidFrom() { return validFrom; }
    public String getValidTo() { return validTo; }
    public Boolean getIsDefault() { return isDefault; }
    public Boolean getShowInQuoteBuilder() { return showInQuoteBuilder; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public List<PriceBookProductPricing> getProductPricing() { return productPricing; }
    public PriceBookType getPriceBookType() { return priceBookType; }
    public Integer getProductCount() { return productCount; }

    /**
     * Nested price book type reference.
     */
    public static class PriceBookType {
        private String id;
        private String name;
        private String categoryType;

        public String getId() { return id; }
        public String getName() { return name; }
        public String getCategoryType() { return categoryType; }
    }
}
