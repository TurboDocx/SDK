package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.Map;

/**
 * Represents a recipient in review link responses
 */
public class ReviewRecipient {
    @SerializedName("id")
    private String id;

    @SerializedName("name")
    private String name;

    @SerializedName("email")
    private String email;

    @SerializedName("metadata")
    private Map<String, Object> metadata;

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }
}
