package com.turbodocx;

/**
 * Main client for TurboDocx API
 */
public class TurboDocxClient {
    private final TurboSign turboSign;

    private TurboDocxClient(Builder builder) {
        HttpClient httpClient = new HttpClient(builder.baseUrl, builder.apiKey, builder.accessToken, builder.orgId);
        this.turboSign = new TurboSign(httpClient);
    }

    /**
     * Get the TurboSign client for digital signature operations
     */
    public TurboSign turboSign() {
        return turboSign;
    }

    /**
     * Builder for TurboDocxClient
     */
    public static class Builder {
        private String apiKey;
        private String accessToken;
        private String orgId;
        private String baseUrl;

        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        public Builder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        /**
         * Set the Organization ID (required for authentication)
         */
        public Builder orgId(String orgId) {
            this.orgId = orgId;
            return this;
        }

        public Builder baseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
            return this;
        }

        public TurboDocxClient build() {
            if ((apiKey == null || apiKey.isEmpty()) && (accessToken == null || accessToken.isEmpty())) {
                throw new IllegalArgumentException("API key or access token is required");
            }
            if (orgId == null || orgId.isEmpty()) {
                throw new TurboDocxException.AuthenticationException("Organization ID (orgId) is required for authentication");
            }
            return new TurboDocxClient(this);
        }
    }
}
