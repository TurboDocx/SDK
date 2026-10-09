package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.Collections;
import java.util.List;

/**
 * Response from preparing a document for review
 */
public class CreateSignatureReviewLinkResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("documentId")
    private String documentId;

    @SerializedName("status")
    private String status;

    @SerializedName("previewUrl")
    private String previewUrl;

    @SerializedName("message")
    private String message;

    @SerializedName("recipients")
    private List<ReviewRecipient> recipients;

    public boolean isSuccess() {
        return success;
    }

    public String getDocumentId() {
        return documentId;
    }

    public String getStatus() {
        return status;
    }

    public String getPreviewUrl() {
        return previewUrl;
    }

    public String getMessage() {
        return message;
    }

    /** The recipients, always present on a successful response (an empty list, never null). */
    public List<ReviewRecipient> getRecipients() {
        return recipients != null ? recipients : Collections.emptyList();
    }
}
