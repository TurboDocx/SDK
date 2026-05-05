package com.turbodocx.models.quote;

import java.util.List;

/**
 * Request to update a product.
 * Note: images are handled via multipart form data at the TurboQuote layer.
 */
public class UpdateProductRequest {
    private String name;
    private Double listPrice;
    private String billingFrequency;
    private String sku;
    private String description;
    private String detailedSpecification;
    private String internalNotes;
    private String categoryId;
    private Double cost;
    private Integer minimumOrderQuantity;
    private String currency;
    private Boolean showInCatalog;
    private List<String> imageIdsToKeep;
    private List<String> imageOrder;

    // images are handled separately (byte arrays for multipart upload)
    private transient byte[][] images;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getListPrice() { return listPrice; }
    public void setListPrice(Double listPrice) { this.listPrice = listPrice; }
    public String getBillingFrequency() { return billingFrequency; }
    public void setBillingFrequency(String billingFrequency) { this.billingFrequency = billingFrequency; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDetailedSpecification() { return detailedSpecification; }
    public void setDetailedSpecification(String detailedSpecification) { this.detailedSpecification = detailedSpecification; }
    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    public Integer getMinimumOrderQuantity() { return minimumOrderQuantity; }
    public void setMinimumOrderQuantity(Integer minimumOrderQuantity) { this.minimumOrderQuantity = minimumOrderQuantity; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Boolean getShowInCatalog() { return showInCatalog; }
    public void setShowInCatalog(Boolean showInCatalog) { this.showInCatalog = showInCatalog; }
    public List<String> getImageIdsToKeep() { return imageIdsToKeep; }
    public void setImageIdsToKeep(List<String> imageIdsToKeep) { this.imageIdsToKeep = imageIdsToKeep; }
    public List<String> getImageOrder() { return imageOrder; }
    public void setImageOrder(List<String> imageOrder) { this.imageOrder = imageOrder; }
    public byte[][] getImages() { return images; }
    public void setImages(byte[][] images) { this.images = images; }
}
