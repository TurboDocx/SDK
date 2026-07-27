package com.turbodocx;

/**
 * Base exception thrown when TurboDocx API returns an error
 */
public class TurboDocxException extends RuntimeException {
    private final int statusCode;
    private final String code;

    public TurboDocxException(String message, int statusCode, String code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }

    public TurboDocxException(String message, int statusCode) {
        this(message, statusCode, null);
    }

    public TurboDocxException(String message) {
        this(message, 0, null);
    }

    /**
     * Returns {@code code} when the API supplied one, otherwise the subclass default.
     * Not every backend error carries a machine-readable code, but {@code getCode()} must
     * still be branchable — so the default fills the gap. An API-supplied code always wins.
     * Kept identical across all six SDKs.
     */
    static String orDefault(String code, String defaultCode) {
        return (code == null || code.isEmpty()) ? defaultCode : code;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getCode() {
        return code;
    }

    /**
     * Exception thrown when authentication fails (HTTP 401)
     */
    public static class AuthenticationException extends TurboDocxException {
        public static final String DEFAULT_CODE = "AUTHENTICATION_ERROR";

        public AuthenticationException(String message, String code) {
            super(message, 401, orDefault(code, DEFAULT_CODE));
        }
        public AuthenticationException(String message) {
            this(message, null);
        }
    }

    /**
     * Exception thrown when the caller is authenticated but lacks the
     * permissions required by the route (HTTP 403).
     */
    public static class AuthorizationException extends TurboDocxException {
        public static final String DEFAULT_CODE = "AUTHORIZATION_ERROR";

        public AuthorizationException(String message, String code) {
            super(message, 403, orDefault(code, DEFAULT_CODE));
        }
        public AuthorizationException(String message) {
            this(message, null);
        }
    }

    /**
     * Exception thrown when validation fails (HTTP 400)
     */
    public static class ValidationException extends TurboDocxException {
        public static final String DEFAULT_CODE = "VALIDATION_ERROR";

        public ValidationException(String message, String code) {
            super(message, 400, orDefault(code, DEFAULT_CODE));
        }
        public ValidationException(String message) {
            this(message, null);
        }
    }

    /**
     * Exception thrown when resource is not found (HTTP 404)
     */
    public static class NotFoundException extends TurboDocxException {
        public static final String DEFAULT_CODE = "NOT_FOUND";

        public NotFoundException(String message, String code) {
            super(message, 404, orDefault(code, DEFAULT_CODE));
        }
        public NotFoundException(String message) {
            this(message, null);
        }
    }

    /**
     * Exception thrown when a request conflicts with the current state of
     * the resource (HTTP 409). For example, attempting to create a webhook
     * with a name that already exists.
     */
    public static class ConflictException extends TurboDocxException {
        public static final String DEFAULT_CODE = "CONFLICT";

        public ConflictException(String message, String code) {
            super(message, 409, orDefault(code, DEFAULT_CODE));
        }
        public ConflictException(String message) {
            this(message, null);
        }
    }

    /**
     * Exception thrown when rate limit is exceeded (HTTP 429)
     */
    public static class RateLimitException extends TurboDocxException {
        public static final String DEFAULT_CODE = "RATE_LIMIT_EXCEEDED";

        public RateLimitException(String message, String code) {
            super(message, 429, orDefault(code, DEFAULT_CODE));
        }
        public RateLimitException(String message) {
            this(message, null);
        }
    }

    /**
     * Exception thrown when a network error occurs
     */
    public static class NetworkException extends TurboDocxException {
        public static final String DEFAULT_CODE = "NETWORK_ERROR";

        public NetworkException(String message) {
            super(message, 0, DEFAULT_CODE);
        }
    }
}
