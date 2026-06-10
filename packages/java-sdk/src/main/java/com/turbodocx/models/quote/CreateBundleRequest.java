package com.turbodocx.models.quote;

import java.util.List;

/**
 * Request to create a bundle.
 *
 * <p>Note: {@code categoryId} is required by the backend.</p>
 */
public class CreateBundleRequest {
    private String name;
    private String categoryId;
    private List<BundleItemInput> items;
    private String description;
    private String sku;
    private DiscountType bundleDiscountType;
    private Double bundleDiscountPercent;
    private Double bundleDiscountAmount;
    private String currency;
    private Boolean showItemsToEndUser;
    private Boolean showInCatalog;
    private Boolean syncWithProducts;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    /** Required. UUID of the bundle category. */
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public List<BundleItemInput> getItems() { return items; }
    public void setItems(List<BundleItemInput> items) { this.items = items; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public DiscountType getBundleDiscountType() { return bundleDiscountType; }
    public void setBundleDiscountType(DiscountType bundleDiscountType) { this.bundleDiscountType = bundleDiscountType; }
    public Double getBundleDiscountPercent() { return bundleDiscountPercent; }
    public void setBundleDiscountPercent(Double bundleDiscountPercent) { this.bundleDiscountPercent = bundleDiscountPercent; }
    public Double getBundleDiscountAmount() { return bundleDiscountAmount; }
    public void setBundleDiscountAmount(Double bundleDiscountAmount) { this.bundleDiscountAmount = bundleDiscountAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Boolean getShowItemsToEndUser() { return showItemsToEndUser; }
    public void setShowItemsToEndUser(Boolean showItemsToEndUser) { this.showItemsToEndUser = showItemsToEndUser; }
    public Boolean getShowInCatalog() { return showInCatalog; }
    public void setShowInCatalog(Boolean showInCatalog) { this.showInCatalog = showInCatalog; }
    public Boolean getSyncWithProducts() { return syncWithProducts; }
    public void setSyncWithProducts(Boolean syncWithProducts) { this.syncWithProducts = syncWithProducts; }
}
