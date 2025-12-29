package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from getting document status
 */
public class DocumentStatusResponse {
    @SerializedName("status")
    private String status;

    public String getStatus() {
        return status;
    }
}
