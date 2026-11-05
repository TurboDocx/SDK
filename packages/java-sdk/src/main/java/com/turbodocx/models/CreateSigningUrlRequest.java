package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request an embedded signing URL for one recipient. Provide exactly one selector
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

    /**
     * How the embedded signing page shows its page navigation when loaded in an iframe. Null sends
     * nothing (the API uses auto). Applies to this issuance only.
     */
    @SerializedName("pageNavigation")
    private final PageNavigation pageNavigation;

    private CreateSigningUrlRequest(Builder builder) {
        this.recipientId = builder.recipientId;
        this.externalId = builder.externalId;
        this.identityAssertion = builder.identityAssertion;
        this.returnUrl = builder.returnUrl;
        this.pageNavigation = builder.pageNavigation;
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

    public PageNavigation getPageNavigation() {
        return pageNavigation;
    }

    public static class Builder {
        private String recipientId;
        private String externalId;
        private IdentityAssertion identityAssertion;
        private String returnUrl;
        private PageNavigation pageNavigation;

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

        /**
         * How the embedded signing page shows its page navigation: {@link PageNavigation#AUTO}
         * (the default, sized to the iframe width), {@link PageNavigation#COLLAPSED} or
         * {@link PageNavigation#HIDDEN}. A later call without it (or with AUTO) resets to auto.
         */
        public Builder pageNavigation(PageNavigation pageNavigation) {
            this.pageNavigation = pageNavigation;
            return this;
        }

        public CreateSigningUrlRequest build() {
            return new CreateSigningUrlRequest(this);
        }
    }
}
