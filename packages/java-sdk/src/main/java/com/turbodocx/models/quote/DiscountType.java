package com.turbodocx.models.quote;

import com.google.gson.annotations.SerializedName;

/**
 * Discount type enum: percent-based or fixed-amount discount.
 */
public enum DiscountType {
    @SerializedName("percent")
    PERCENT("percent"),
    @SerializedName("amount")
    AMOUNT("amount");

    private final String value;
    DiscountType(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
