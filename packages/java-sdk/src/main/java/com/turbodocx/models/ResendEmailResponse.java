package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from resending email
 */
public class ResendEmailResponse {
    @SerializedName("success")
    private Boolean success;

    @SerializedName("recipientCount")
    private Integer recipientCount;

    // Legacy fields (for backwards compatibility if backend changes)
    @SerializedName("documentId")
    private String documentId;

    @SerializedName("message")
    private String message;

    @SerializedName("resentAt")
    private String resentAt;

    public Boolean getSuccess() {
        return success;
    }

    public Integer getRecipientCount() {
        return recipientCount;
    }

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
