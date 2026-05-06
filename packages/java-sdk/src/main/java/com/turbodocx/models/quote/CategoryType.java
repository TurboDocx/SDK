package com.turbodocx.models.quote;

import com.google.gson.annotations.SerializedName;

/**
 * Category type enum for quote types/categories.
 */
public enum CategoryType {
    @SerializedName("product_category")
    PRODUCT_CATEGORY("product_category"),
    @SerializedName("pricebook_type")
    PRICEBOOK_TYPE("pricebook_type"),
    @SerializedName("company_industry")
    COMPANY_INDUSTRY("company_industry"),
    @SerializedName("bundle_category")
    BUNDLE_CATEGORY("bundle_category");

    private final String value;
    CategoryType(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
