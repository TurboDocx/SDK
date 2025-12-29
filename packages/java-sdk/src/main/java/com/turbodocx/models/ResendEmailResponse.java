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

    public Boolean getSuccess() {
        return success;
    }

    public Integer getRecipientCount() {
        return recipientCount;
    }
}
