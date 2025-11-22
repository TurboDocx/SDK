package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from resending email
 */
public class ResendEmailResponse {
    @SerializedName("documentId")
    private String documentId;

    @SerializedName("message")
    private String message;

    @SerializedName("resentAt")
    private String resentAt;

    public String getDocumentId() {
        return documentId;
    }

    public String getMessage() {
        return message;
    }

    public String getResentAt() {
        return resentAt;
    }
}
