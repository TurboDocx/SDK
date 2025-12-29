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

    @SerializedName("signUrl")
    private String signUrl;

    @SerializedName("signedAt")
    private String signedAt;

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getSignUrl() {
        return signUrl;
    }

    public String getSignedAt() {
        return signedAt;
    }
}
