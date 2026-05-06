package com.turbodocx.models.quote;

import java.util.List;

/**
 * Request to update a bundle.
 */
public class UpdateBundleRequest extends TrackableRequest {
    private String name;
    private List<BundleItemInput> items;
    private String description;
    private String sku;
    private String categoryId;
    private Double bundleDiscountPercent;
    private String currency;
    private Boolean showItemsToEndUser;
    private Boolean showInCatalog;
    private Boolean syncWithProducts;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; markFieldSet("name"); }
    public List<BundleItemInput> getItems() { return items; }
    public void setItems(List<BundleItemInput> items) { this.items = items; markFieldSet("items"); }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; markFieldSet("description"); }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; markFieldSet("sku"); }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; markFieldSet("categoryId"); }
    public Double getBundleDiscountPercent() { return bundleDiscountPercent; }
    public void setBundleDiscountPercent(Double bundleDiscountPercent) { this.bundleDiscountPercent = bundleDiscountPercent; markFieldSet("bundleDiscountPercent"); }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; markFieldSet("currency"); }
    public Boolean getShowItemsToEndUser() { return showItemsToEndUser; }
    public void setShowItemsToEndUser(Boolean showItemsToEndUser) { this.showItemsToEndUser = showItemsToEndUser; markFieldSet("showItemsToEndUser"); }
    public Boolean getShowInCatalog() { return showInCatalog; }
    public void setShowInCatalog(Boolean showInCatalog) { this.showInCatalog = showInCatalog; markFieldSet("showInCatalog"); }
    public Boolean getSyncWithProducts() { return syncWithProducts; }
    public void setSyncWithProducts(Boolean syncWithProducts) { this.syncWithProducts = syncWithProducts; markFieldSet("syncWithProducts"); }
}
