package com.turbodocx.models;

/**
 * Download format options for deliverables
 */
public enum DeliverableDownloadFormat {
    /**
     * Download in original format (DOCX/PPTX)
     */
    SOURCE("source"),

    /**
     * Download as PDF
     */
    PDF("pdf");

    private final String value;

    DeliverableDownloadFormat(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }

    public static DeliverableDownloadFormat fromString(String value) {
        for (DeliverableDownloadFormat format : DeliverableDownloadFormat.values()) {
            if (format.value.equalsIgnoreCase(value)) {
                return format;
            }
        }
        throw new IllegalArgumentException("Unknown DeliverableDownloadFormat: " + value);
    }
}
