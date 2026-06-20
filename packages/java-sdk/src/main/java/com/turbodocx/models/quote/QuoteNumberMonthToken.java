package com.turbodocx.models.quote;

import com.google.gson.annotations.SerializedName;

/**
 * Month token for quote number formatting.
 *
 * <ul>
 *   <li>{@code OFF} — no month segment</li>
 *   <li>{@code TWO} — two-digit month (e.g. {@code 06})</li>
 * </ul>
 */
public enum QuoteNumberMonthToken {
    @SerializedName("off")
    OFF("off"),
    @SerializedName("two")
    TWO("two");

    private final String value;
    QuoteNumberMonthToken(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
