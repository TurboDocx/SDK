package com.turbodocx.models.quote;

/**
 * The org's quote numbering configuration: the {@link QuoteNumberFormat} plus the
 * current per-period issued floor.
 *
 * <p>{@code currentFloor} is the highest number already issued for the current period;
 * {@code startNumber} cannot be set below it.</p>
 */
public class QuoteNumberConfig {
    private QuoteNumberFormat format;
    private Integer currentFloor;

    public QuoteNumberFormat getFormat() { return format; }
    public Integer getCurrentFloor() { return currentFloor; }
}
