package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Represents a document recipient
 */
public class Recipient {
    @SerializedName("name")
    private final String name;

    @SerializedName("email")
    private final String email;

    @SerializedName("order")
    private final int order;

    public Recipient(String name, String email, int order) {
        this.name = name;
        this.email = email;
        this.order = order;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public int getOrder() {
        return order;
    }
}
