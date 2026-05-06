package com.turbodocx.models.quote;

import com.google.gson.annotations.SerializedName;

/**
 * Renewal period enum for quotes.
 */
public enum RenewalPeriod {
    @SerializedName("weekly")
    WEEKLY("weekly"),
    @SerializedName("monthly")
    MONTHLY("monthly"),
    @SerializedName("quarterly")
    QUARTERLY("quarterly"),
    @SerializedName("annually")
    ANNUALLY("annually");

    private final String value;
    RenewalPeriod(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
