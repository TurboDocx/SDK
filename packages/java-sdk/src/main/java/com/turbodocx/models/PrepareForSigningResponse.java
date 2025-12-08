package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

/**
 * Response from preparing a document for signing
 */
public class PrepareForSigningResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("documentId")
    private String documentId;

    @SerializedName("status")
    private String status;

    @SerializedName("message")
    private String message;

    @SerializedName("recipients")
    private List<RecipientResponse> recipients;

    public boolean isSuccess() {
        return success;
    }

    public String getDocumentId() {
        return documentId;
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public List<RecipientResponse> getRecipients() {
        return recipients;
    }
}
