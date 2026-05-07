package com.turbodocx;

/**
 * Client for TurboDocx Quoting API.
 *
 * <p>Use the {@link Builder} to configure credentials and create
 * a client instance. Unlike TurboDocxClient, senderEmail is NOT required
 * since TurboQuote does not send signature emails.</p>
 *
 * <pre>{@code
 * TurboQuoteClient client = new TurboQuoteClient.Builder()
 *     .apiKey("your-api-key")
 *     .orgId("your-org-id")
 *     .build();
 *
 * Quote quote = client.turboQuote().createQuote(request);
 * }</pre>
 */
public final class TurboQuoteClient {
    private final TurboQuote turboQuote;

    private TurboQuoteClient(Builder builder) {
        HttpClient httpClient = new HttpClient(
                builder.baseUrl,
                builder.apiKey,
                builder.accessToken,
                builder.orgId,
                null,  // senderEmail not required for TurboQuote
                null   // senderName not required for TurboQuote
        );
        this.turboQuote = new TurboQuote(httpClient);
    }

    /**
     * Get the TurboQuote module for quoting operations.
     */
    public TurboQuote turboQuote() {
        return turboQuote;
    }

    /**
     * Builder for TurboQuoteClient.
     */
    public static class Builder {
        private String apiKey;
        private String accessToken;
        private String orgId;
        private String baseUrl;

        /**
         * Set the API key (required, unless accessToken is set).
         */
        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        /**
         * Set the access token (required, unless apiKey is set).
         */
        public Builder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        /**
         * Set the Organization ID (required).
         */
        public Builder orgId(String orgId) {
            this.orgId = orgId;
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
         * Build the TurboQuoteClient.
         *
         * @throws IllegalArgumentException if apiKey/accessToken is missing
         * @throws TurboDocxException.AuthenticationException if orgId is missing
         */
        public TurboQuoteClient build() {
            if ((apiKey == null || apiKey.isEmpty()) && (accessToken == null || accessToken.isEmpty())) {
                throw new IllegalArgumentException("API key or access token is required");
            }
            if (orgId == null || orgId.isEmpty()) {
                throw new TurboDocxException.AuthenticationException(
                        "Organization ID (orgId) is required for authentication");
            }
            return new TurboQuoteClient(this);
        }
    }
}
