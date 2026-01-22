package com.turbodocx;

/**
 * Main client for TurboDocx API
 */
public class TurboDocxClient {
    private final TurboSign turboSign;
    private final TurboTemplate turboTemplate;

    private TurboDocxClient(Builder builder) {
        HttpClient httpClient = new HttpClient(builder.baseUrl, builder.apiKey, builder.accessToken, builder.orgId, builder.senderEmail, builder.senderName);
        this.turboSign = new TurboSign(httpClient);
        this.turboTemplate = new TurboTemplate(httpClient);
    }

    /**
     * Get the TurboSign client for digital signature operations
     */
    public TurboSign turboSign() {
        return turboSign;
    }

    /**
     * Get the TurboTemplate client for document templating operations
     */
    public TurboTemplate turboTemplate() {
        return turboTemplate;
    }

    /**
     * Builder for TurboDocxClient
     */
    public static class Builder {
        private String apiKey;
        private String accessToken;
        private String orgId;
        private String baseUrl;
        private String senderEmail;
        private String senderName;

        /**
         * Set the API key (required)
         */
        public Builder apiKey(String apiKey) {
            this.apiKey = apiKey;
            return this;
        }

        public Builder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        /**
         * Set the Organization ID (required)
         */
        public Builder orgId(String orgId) {
            this.orgId = orgId;
            return this;
        }

        /**
         * Set the base URL (optional, defaults to https://api.turbodocx.com)
         */
        public Builder baseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
            return this;
        }

        /**
         * Set the sender email for signature requests (required).
         * This email will be used as the reply-to address when sending signature request emails.
         * Without it, emails will default to "API Service User via TurboSign".
         */
        public Builder senderEmail(String senderEmail) {
            this.senderEmail = senderEmail;
            return this;
        }

        /**
         * Set the sender name for signature requests (optional but strongly recommended).
         * This name will appear in signature request emails. Without this, the sender will
         * appear as "API Service User".
         */
        public Builder senderName(String senderName) {
            this.senderName = senderName;
            return this;
        }

        public TurboDocxClient build() {
            if ((apiKey == null || apiKey.isEmpty()) && (accessToken == null || accessToken.isEmpty())) {
                throw new IllegalArgumentException("API key or access token is required");
            }
            if (orgId == null || orgId.isEmpty()) {
                throw new TurboDocxException.AuthenticationException("Organization ID (orgId) is required for authentication");
            }
            if (senderEmail == null || senderEmail.isEmpty()) {
                throw new TurboDocxException.ValidationException("SenderEmail is required. This email will be used as the reply-to address for signature requests. Without it, emails will default to \"API Service User via TurboSign\".");
            }
            return new TurboDocxClient(this);
        }
    }
}
