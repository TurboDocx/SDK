package com.turbodocx;

/**
 * Main client for TurboDocx API
 */
public final class TurboDocxClient implements AutoCloseable {
    private final HttpClient httpClient;
    private final TurboSign turboSign;
    private final DeliverableClient deliverable;

    private TurboDocxClient(Builder builder) {
        this.httpClient = new HttpClient(
                builder.baseUrl, builder.apiKey, builder.accessToken,
                builder.orgId, builder.senderEmail, builder.senderName,
                builder.connectTimeoutSeconds, builder.readTimeoutSeconds, builder.writeTimeoutSeconds,
                builder.clientContext
        );
        this.turboSign = new TurboSign(this.httpClient);
        this.deliverable = new DeliverableClient(this.httpClient);
    }

    /**
     * Get the TurboSign client for digital signature operations
     */
    public TurboSign turboSign() {
        return turboSign;
    }

    /**
     * Get the Deliverable client for document generation and management
     */
    public DeliverableClient deliverable() {
        return deliverable;
    }

    /**
     * Get the underlying HttpClient for inspection (package-private).
     */
    HttpClient getHttpClient() {
        return httpClient;
    }

    /**
     * Shut down HTTP connection pools and release resources.
     * Safe to call multiple times.
     */
    @Override
    public void close() {
        turboSign.close();
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
        private int connectTimeoutSeconds = 60;
        private int readTimeoutSeconds = 120;
        private int writeTimeoutSeconds = 60;
        private ClientContext clientContext;

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
         * Used as the reply-to address on signature request emails and recorded as the sender
         * in the audit trail. An API key has no mailbox of its own, so the API rejects a send
         * without it rather than mailing from an unmonitored address.
         */
        public Builder senderEmail(String senderEmail) {
            this.senderEmail = senderEmail;
            return this;
        }

        /**
         * Set the sender name for signature requests (optional).
         * Appears in signature request emails and the audit trail. Defaults to the name of
         * your API key.
         */
        public Builder senderName(String senderName) {
            this.senderName = senderName;
            return this;
        }

        /**
         * Describe the calling environment for the signature audit trail
         * (optional). The SDK auto-detects a descriptive User-Agent, timezone,
         * language, and device fingerprint from the host; supply this to
         * override them or to report a client IP (ipAddress) for geolocation.
         */
        public Builder clientContext(ClientContext clientContext) {
            this.clientContext = clientContext;
            return this;
        }

        /**
         * Set the connect timeout in seconds (optional, defaults to 60).
         */
        public Builder connectTimeoutSeconds(int connectTimeoutSeconds) {
            this.connectTimeoutSeconds = connectTimeoutSeconds;
            return this;
        }

        /**
         * Set the read timeout in seconds (optional, defaults to 120).
         */
        public Builder readTimeoutSeconds(int readTimeoutSeconds) {
            this.readTimeoutSeconds = readTimeoutSeconds;
            return this;
        }

        /**
         * Set the write timeout in seconds (optional, defaults to 60).
         */
        public Builder writeTimeoutSeconds(int writeTimeoutSeconds) {
            this.writeTimeoutSeconds = writeTimeoutSeconds;
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
                throw new TurboDocxException.ValidationException("SenderEmail is required. It is used as the reply-to address for signature requests and recorded as the sender in the audit trail. The API rejects sends without it.");
            }
            return new TurboDocxClient(this);
        }

        /**
         * Build a client for Deliverable operations only.
         * Does not require senderEmail/senderName (only needed for TurboSign).
         */
        public DeliverableClient buildDeliverableClient() {
            if ((apiKey == null || apiKey.isEmpty()) && (accessToken == null || accessToken.isEmpty())) {
                throw new IllegalArgumentException("API key or access token is required");
            }
            if (orgId == null || orgId.isEmpty()) {
                throw new TurboDocxException.AuthenticationException("Organization ID (orgId) is required for authentication");
            }
            HttpClient httpClient = new HttpClient(baseUrl, apiKey, accessToken, orgId, senderEmail, senderName,
                    connectTimeoutSeconds, readTimeoutSeconds, writeTimeoutSeconds);
            return new DeliverableClient(httpClient);
        }

        /**
         * Build a {@link TurboWebhooks} client.
         * Does not require senderEmail/senderName (webhook routes do not send email).
         */
        public TurboWebhooks buildWebhooksClient() {
            if ((apiKey == null || apiKey.isEmpty()) && (accessToken == null || accessToken.isEmpty())) {
                throw new IllegalArgumentException("API key or access token is required");
            }
            if (orgId == null || orgId.isEmpty()) {
                throw new TurboDocxException.AuthenticationException("Organization ID (orgId) is required for authentication");
            }
            HttpClient httpClient = new HttpClient(baseUrl, apiKey, accessToken, orgId, senderEmail, senderName,
                    connectTimeoutSeconds, readTimeoutSeconds, writeTimeoutSeconds);
            return new TurboWebhooks(httpClient);
        }
    }
}
