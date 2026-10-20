package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * How the embedded signing page shows its page navigation (the page-thumbnail rail and the
 * "Pages" button) when the signing URL is loaded in an iframe. Sent as {@code pageNavigation} by
 * {@link CreateSigningUrlRequest.Builder#pageNavigation(PageNavigation)}.
 */
public enum PageNavigation {
    /**
     * The default. Sized to the iframe width: the thumbnail rail is open at 1200px and wider,
     * collapsed from 900px to 1199px, and a "Pages" button in the bottom bar under 900px.
     */
    @SerializedName("auto")
    AUTO("auto"),
    /** The rail starts collapsed at any width. The signer can still expand it. */
    @SerializedName("collapsed")
    COLLAPSED("collapsed"),
    /** No rail and no "Pages" button. */
    @SerializedName("hidden")
    HIDDEN("hidden");

    private final String value;
    PageNavigation(String value) { this.value = value; }
    public String getValue() { return value; }
    @Override public String toString() { return value; }
}
