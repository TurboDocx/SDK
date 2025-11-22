package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Represents a recipient in API responses
 */
public class RecipientResponse {
    @SerializedName("id")
    private String id;

    @SerializedName("name")
    private String name;

    @SerializedName("email")
    private String email;

    @SerializedName("status")
    private String status;

    @SerializedName("signUrl")
    private String signUrl;

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getStatus() {
        return status;
    }

    public String getSignUrl() {
        return signUrl;
    }
}
