package com.turbodocx;

/**
 * Client for TurboDocx Partner API.
 *
 * <p>Use the {@link Builder} to configure partner credentials and create
 * a client instance:</p>
 *
 * <pre>{@code
 * TurboPartnerClient client = new TurboPartnerClient.Builder()
 *     .partnerApiKey("TDXP-...")
 *     .partnerId("your-partner-uuid")
 *     .build();
 *
 * JsonObject org = client.turboPartner().createOrganization("Acme Corp");
 * }</pre>
 */
public class TurboPartnerClient {
    private final TurboPartner turboPartner;

    private TurboPartnerClient(Builder builder) {
        PartnerHttpClient httpClient = new PartnerHttpClient(builder.baseUrl, builder.partnerApiKey);
        this.turboPartner = new TurboPartner(httpClient, builder.partnerId);
    }

    /**
     * Get the TurboPartner module for partner portal management operations.
     */
    public TurboPartner turboPartner() {
        return turboPartner;
    }

    /**
     * Builder for TurboPartnerClient.
     */
    public static class Builder {
        private String partnerApiKey;
        private String partnerId;
        private String baseUrl;

        /**
         * Set the partner API key (required). Must start with TDXP-.
         */
        public Builder partnerApiKey(String partnerApiKey) {
            this.partnerApiKey = partnerApiKey;
            return this;
        }

        /**
         * Set the partner ID (required). This is your partner UUID.
         */
        public Builder partnerId(String partnerId) {
            this.partnerId = partnerId;
            return this;
        }

        /**
         * Set the base URL (optional, defaults to https://api.turbodocx.com).
         */
        public Builder baseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
            return this;
        }

        /**
         * Build the TurboPartnerClient.
         *
         * @throws TurboDocxException.AuthenticationException if required fields are missing
         */
        public TurboPartnerClient build() {
            if (partnerApiKey == null || partnerApiKey.isEmpty()) {
                throw new TurboDocxException.AuthenticationException(
                        "Partner API key is required. Partner API keys start with TDXP-.");
            }
            if (partnerId == null || partnerId.isEmpty()) {
                throw new TurboDocxException.AuthenticationException(
                        "Partner ID is required for authentication.");
            }
            return new TurboPartnerClient(this);
        }
    }
}
