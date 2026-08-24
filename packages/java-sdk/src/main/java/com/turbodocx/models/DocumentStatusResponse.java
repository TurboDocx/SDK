package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from getting document status
 */
public class DocumentStatusResponse {
    @SerializedName("status")
    private String status;

    @SerializedName("expiresAt")
    private String expiresAt;

    public String getStatus() {
        return status;
    }

    /**
     * ISO timestamp when the signing window closes, if the document has a deadline.
     * Null when expiration is off (the default), which means the document never expires.
     */
    public String getExpiresAt() {
        return expiresAt;
    }
}
