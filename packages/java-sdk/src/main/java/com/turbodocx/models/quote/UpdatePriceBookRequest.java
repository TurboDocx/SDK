package com.turbodocx.models.quote;

import java.util.List;

/**
 * Request to update a price book.
 */
public class UpdatePriceBookRequest extends TrackableRequest {
    private String name;
    private String priceBookTypeId;
    private String description;
    private Double discountPercent;
    private String validFrom;
    private String validTo;
    private Boolean isDefault;
    private Boolean showInQuoteBuilder;
    private List<PriceBookProductPricingInput> productPricing;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; markFieldSet("name"); }
    public String getPriceBookTypeId() { return priceBookTypeId; }
    public void setPriceBookTypeId(String priceBookTypeId) { this.priceBookTypeId = priceBookTypeId; markFieldSet("priceBookTypeId"); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; markFieldSet("description"); }
    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; markFieldSet("discountPercent"); }
    public String getValidFrom() { return validFrom; }
    public void setValidFrom(String validFrom) { this.validFrom = validFrom; markFieldSet("validFrom"); }
    public String getValidTo() { return validTo; }
    public void setValidTo(String validTo) { this.validTo = validTo; markFieldSet("validTo"); }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; markFieldSet("isDefault"); }
    public Boolean getShowInQuoteBuilder() { return showInQuoteBuilder; }
    public void setShowInQuoteBuilder(Boolean showInQuoteBuilder) { this.showInQuoteBuilder = showInQuoteBuilder; markFieldSet("showInQuoteBuilder"); }
    public List<PriceBookProductPricingInput> getProductPricing() { return productPricing; }
    public void setProductPricing(List<PriceBookProductPricingInput> productPricing) { this.productPricing = productPricing; markFieldSet("productPricing"); }
}
