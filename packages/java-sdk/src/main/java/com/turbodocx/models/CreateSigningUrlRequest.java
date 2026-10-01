package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request a single-use embedded signing URL for one recipient. Provide exactly one selector
 * ({@code recipientId} or {@code externalId}).
 */
public class CreateSigningUrlRequest {
    /** Select the recipient by TurboDocx recipient id... */
    @SerializedName("recipientId")
    private final String recipientId;

    /** ...or by the externalId you set when creating the recipient. Provide exactly one. */
    @SerializedName("externalId")
    private final String externalId;

    /** Required only when the recipient's mode is external_idv. */
    @SerializedName("identityAssertion")
    private final IdentityAssertion identityAssertion;

    /** Where TurboSign returns the signer after completion (https only). */
    @SerializedName("returnUrl")
    private final String returnUrl;

    private CreateSigningUrlRequest(Builder builder) {
        this.recipientId = builder.recipientId;
        this.externalId = builder.externalId;
        this.identityAssertion = builder.identityAssertion;
        this.returnUrl = builder.returnUrl;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public String getExternalId() {
        return externalId;
    }

    public IdentityAssertion getIdentityAssertion() {
        return identityAssertion;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public static class Builder {
        private String recipientId;
        private String externalId;
        private IdentityAssertion identityAssertion;
        private String returnUrl;

        public Builder recipientId(String recipientId) {
            this.recipientId = recipientId;
            return this;
        }

        public Builder externalId(String externalId) {
            this.externalId = externalId;
            return this;
        }

        public Builder identityAssertion(IdentityAssertion identityAssertion) {
            this.identityAssertion = identityAssertion;
            return this;
        }

        public Builder returnUrl(String returnUrl) {
            this.returnUrl = returnUrl;
            return this;
        }

        public CreateSigningUrlRequest build() {
            return new CreateSigningUrlRequest(this);
        }
    }
}
