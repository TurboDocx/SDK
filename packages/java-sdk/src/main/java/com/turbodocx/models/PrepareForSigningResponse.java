package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

/**
 * Response from preparing a document for signing
 */
public class PrepareForSigningResponse {
    @SerializedName("documentId")
    private String documentId;

    @SerializedName("status")
    private String status;

    @SerializedName("recipients")
    private List<RecipientResponse> recipients;

    public String getDocumentId() {
        return documentId;
    }

    public String getStatus() {
        return status;
    }

    public List<RecipientResponse> getRecipients() {
        return recipients;
    }
}
