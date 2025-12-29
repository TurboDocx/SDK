package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from voiding a document
 */
public class VoidDocumentResponse {
    @SerializedName("success")
    private Boolean success;

    @SerializedName("message")
    private String message;

    // Default constructor for Gson
    public VoidDocumentResponse() {}

    // Constructor for manual creation (backend returns empty data)
    public VoidDocumentResponse(Boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public Boolean getSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }
}
