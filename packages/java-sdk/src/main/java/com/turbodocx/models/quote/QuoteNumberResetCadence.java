package com.turbodocx.models.quote;

import com.google.gson.annotations.SerializedName;

/**
 * Reset cadence for the running quote number counter.
 *
 * <ul>
 *   <li>{@code NEVER} — the counter never resets</li>
 *   <li>{@code YEARLY} — the counter resets at the start of each year</li>
 *   <li>{@code MONTHLY} — the counter resets at the start of each month</li>
 * </ul>
 */
public enum QuoteNumberResetCadence {
    @SerializedName("never")
    NEVER("never"),
    @SerializedName("yearly")
    YEARLY("yearly"),
    @SerializedName("monthly")
    MONTHLY("monthly");

    private final String value;
    QuoteNumberResetCadence(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
