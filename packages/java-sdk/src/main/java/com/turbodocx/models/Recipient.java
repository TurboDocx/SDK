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

    @SerializedName("signingOrder")
    private final int signingOrder;

    public Recipient(String name, String email, int signingOrder) {
        this.name = name;
        this.email = email;
        this.signingOrder = signingOrder;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public int getSigningOrder() {
        return signingOrder;
    }
}
