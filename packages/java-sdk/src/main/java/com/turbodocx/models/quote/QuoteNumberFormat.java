package com.turbodocx.models.quote;

/**
 * Per-org quote numbering format.
 *
 * <p>All eight fields are required by the backend — a quote-number-config PATCH
 * is a full replacement of the format, not a partial update. Field names serialize
 * verbatim (camelCase) to match the backend Joi schema.</p>
 *
 * <p>{@code padWidth} (0-12) and {@code startNumber} (&gt;= 0) are integers, per the
 * backend {@code Joi.number().integer()} validation.</p>
 */
public class QuoteNumberFormat {
    private String prefix;
    private QuoteNumberYearToken yearToken;
    private QuoteNumberMonthToken monthToken;
    private String separator;
    private Integer padWidth;
    private String suffix;
    private Integer startNumber;
    private QuoteNumberResetCadence resetCadence;

    public String getPrefix() { return prefix; }
    public void setPrefix(String prefix) { this.prefix = prefix; }

    public QuoteNumberYearToken getYearToken() { return yearToken; }
    public void setYearToken(QuoteNumberYearToken yearToken) { this.yearToken = yearToken; }

    public QuoteNumberMonthToken getMonthToken() { return monthToken; }
    public void setMonthToken(QuoteNumberMonthToken monthToken) { this.monthToken = monthToken; }

    public String getSeparator() { return separator; }
    public void setSeparator(String separator) { this.separator = separator; }

    public Integer getPadWidth() { return padWidth; }
    public void setPadWidth(Integer padWidth) { this.padWidth = padWidth; }

    public String getSuffix() { return suffix; }
    public void setSuffix(String suffix) { this.suffix = suffix; }

    public Integer getStartNumber() { return startNumber; }
    public void setStartNumber(Integer startNumber) { this.startNumber = startNumber; }

    public QuoteNumberResetCadence getResetCadence() { return resetCadence; }
    public void setResetCadence(QuoteNumberResetCadence resetCadence) { this.resetCadence = resetCadence; }
}
