package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from voiding a document
 */
public class VoidDocumentResponse {
    @SerializedName("id")
    private String id;

    @SerializedName("name")
    private String name;

    @SerializedName("status")
    private String status;

    @SerializedName("voidReason")
    private String voidReason;

    @SerializedName("voidedAt")
    private String voidedAt;

    // Default constructor for Gson
    public VoidDocumentResponse() {}

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getStatus() {
        return status;
    }

    public String getVoidReason() {
        return voidReason;
    }

    public String getVoidedAt() {
        return voidedAt;
    }
}
