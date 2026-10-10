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

    /**
     * Signing order (1-indexed). Null (omitted) for a recipient with a {@link #getRole() role}: a
     * template's roles sign in the order saved on the template, and recipients without a role sign
     * after them.
     */
    @SerializedName("signingOrder")
    private final Integer signingOrder;

    /**
     * The template signer role this recipient fills (e.g. {@code "client"}), when sending a
     * {@code templateId} whose signers and fields were set up in TurboDocx. The recipient gets every
     * field saved for that role. A role you leave out uses the signer saved on the template, if it
     * has one. List a template's roles with {@code TurboSign.getTemplateSignatureSetup}. Null
     * (default) is omitted from the request.
     */
    @SerializedName("role")
    private final String role;

    /**
     * E.164 phone number (e.g. +13055551234). Required when identity verification uses SMS OTP.
     * Null (default) is omitted from the request by Gson.
     */
    @SerializedName("phone")
    private final String phone;

    /**
     * Your own identifier for this signer (e.g. an Airtable record id), unique within the document.
     * Lets you request a signing URL by your key instead of storing TurboDocx's recipient id.
     * A blank or whitespace-only value counts as absent (stored as null, so it never collides with
     * another blank and cannot be used to look the recipient up).
     */
    @SerializedName("externalId")
    private final String externalId;

    /**
     * Identity verification for embedded signing. Omit it to take the org's default channel
     * ({@link EmbeddedSigningSettings#getDefaultChannel()}): no verification when that is
     * {@code "none"}, otherwise a passcode on the default channel.
     */
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
        this.role = null;
    }

    /**
     * A recipient filling a template signer role. No signing order is needed: roles sign in the
     * order saved on the template.
     *
     * @param role  the role key, from {@code TurboSign.getTemplateSignatureSetup}
     * @param name  the signer's name
     * @param email the signer's email
     */
    public static Recipient withRole(String role, String name, String email) {
        return new Builder().role(role).name(name).email(email).build();
    }

    private Recipient(Builder builder) {
        this.name = builder.name;
        this.email = builder.email;
        this.signingOrder = builder.signingOrder;
        this.phone = builder.phone;
        this.externalId = builder.externalId;
        this.identityVerification = builder.identityVerification;
        this.role = builder.role;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    /** The signing order, or null when not set (a recipient with a role). */
    public Integer getSigningOrder() {
        return signingOrder;
    }

    public String getPhone() {
        return phone;
    }

    public String getRole() {
        return role;
    }

    public String getExternalId() {
        return externalId;
    }

    public IdentityVerification getIdentityVerification() {
        return identityVerification;
    }

    /**
     * Builder for recipients that carry a template role or embedded-signing details (phone,
     * externalId, identity verification). The three-argument constructor remains for the simple email-invite flow.
     */
    public static class Builder {
        private String name;
        private String email;
        private Integer signingOrder;
        private String phone;
        private String role;
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

        public Builder signingOrder(Integer signingOrder) {
            this.signingOrder = signingOrder;
            return this;
        }

        /** The template signer role this recipient fills; see {@link Recipient#getRole()}. */
        public Builder role(String role) {
            this.role = role;
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
