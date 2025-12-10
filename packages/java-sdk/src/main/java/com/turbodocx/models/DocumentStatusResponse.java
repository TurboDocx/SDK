package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

/**
 * Response from getting document status
 */
public class DocumentStatusResponse {
    @SerializedName("documentId")
    private String documentId;

    @SerializedName("status")
    private String status;

    @SerializedName("name")
    private String name;

    @SerializedName("recipients")
    private List<RecipientResponse> recipients;

    @SerializedName("createdAt")
    private String createdAt;

    @SerializedName("updatedAt")
    private String updatedAt;

    @SerializedName("completedAt")
    private String completedAt;

    public String getDocumentId() {
        return documentId;
    }

    public String getStatus() {
        return status;
    }

    public String getName() {
        return name;
    }

    public List<RecipientResponse> getRecipients() {
        return recipients;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public String getCompletedAt() {
        return completedAt;
    }
}
