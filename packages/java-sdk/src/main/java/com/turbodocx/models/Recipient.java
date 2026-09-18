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

    /**
     * E.164 phone number (e.g. +13055551234). Required when identity verification uses SMS OTP.
     * Null (default) is omitted from the request by Gson.
     */
    @SerializedName("phone")
    private final String phone;

    /**
     * Your own identifier for this signer (e.g. an Airtable record id), unique within the document.
     * Lets you request a signing URL by your key instead of storing TurboDocx's recipient id.
     */
    @SerializedName("externalId")
    private final String externalId;

    /** Identity verification for embedded signing. Omit for the default email-invite flow. */
    @SerializedName("identityVerification")
    private final IdentityVerification identityVerification;

    public Recipient(String name, String email, int signingOrder) {
        this(name, email, signingOrder, null, null, null);
    }

    public Recipient(String name, String email, int signingOrder, String phone, String externalId,
                     IdentityVerification identityVerification) {
        this.name = name;
        this.email = email;
        this.signingOrder = signingOrder;
        this.phone = phone;
        this.externalId = externalId;
        this.identityVerification = identityVerification;
    }

    private Recipient(Builder builder) {
        this.name = builder.name;
        this.email = builder.email;
        this.signingOrder = builder.signingOrder;
        this.phone = builder.phone;
        this.externalId = builder.externalId;
        this.identityVerification = builder.identityVerification;
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

    public String getPhone() {
        return phone;
    }

    public String getExternalId() {
        return externalId;
    }

    public IdentityVerification getIdentityVerification() {
        return identityVerification;
    }

    /**
     * Builder for recipients that carry embedded-signing details (phone, externalId, identity
     * verification). The three-argument constructor remains for the simple email-invite flow.
     */
    public static class Builder {
        private String name;
        private String email;
        private int signingOrder;
        private String phone;
        private String externalId;
        private IdentityVerification identityVerification;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder signingOrder(int signingOrder) {
            this.signingOrder = signingOrder;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder externalId(String externalId) {
            this.externalId = externalId;
            return this;
        }

        public Builder identityVerification(IdentityVerification identityVerification) {
            this.identityVerification = identityVerification;
            return this;
        }

        public Recipient build() {
            return new Recipient(this);
        }
    }
}
