package com.turbodocx.models.quote;

import com.google.gson.annotations.SerializedName;

/**
 * Currency enum for quotes.
 */
public enum Currency {
    @SerializedName("USD")
    USD("USD"),
    @SerializedName("EUR")
    EUR("EUR"),
    @SerializedName("GBP")
    GBP("GBP"),
    @SerializedName("CAD")
    CAD("CAD"),
    @SerializedName("INR")
    INR("INR"),
    @SerializedName("AUD")
    AUD("AUD");

    private final String value;
    Currency(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
