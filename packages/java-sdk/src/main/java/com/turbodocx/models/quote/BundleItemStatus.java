package com.turbodocx.models.quote;

import com.google.gson.annotations.SerializedName;

/**
 * Bundle item status enum.
 */
public enum BundleItemStatus {
    @SerializedName("active")
    ACTIVE("active"),
    @SerializedName("product_deleted")
    PRODUCT_DELETED("product_deleted"),
    @SerializedName("product_unavailable")
    PRODUCT_UNAVAILABLE("product_unavailable"),
    @SerializedName("currency_mismatch")
    CURRENCY_MISMATCH("currency_mismatch");

    private final String value;
    BundleItemStatus(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
