package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from voiding a document
 */
public class VoidDocumentResponse {
    @SerializedName("documentId")
    private String documentId;

    @SerializedName("status")
    private String status;

    @SerializedName("voidedAt")
    private String voidedAt;

    public String getDocumentId() {
        return documentId;
    }

    public String getStatus() {
        return status;
    }

    public String getVoidedAt() {
        return voidedAt;
    }
}
