package com.turbodocx.models.quote;

import com.google.gson.annotations.SerializedName;

/**
 * Year token for quote number formatting.
 *
 * <ul>
 *   <li>{@code NONE} — no year segment</li>
 *   <li>{@code TWO} — two-digit year (e.g. {@code 26})</li>
 *   <li>{@code FOUR} — four-digit year (e.g. {@code 2026})</li>
 * </ul>
 */
public enum QuoteNumberYearToken {
    @SerializedName("none")
    NONE("none"),
    @SerializedName("two")
    TWO("two"),
    @SerializedName("four")
    FOUR("four");

    private final String value;
    QuoteNumberYearToken(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
