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
        public AuthenticationException(String message, String code) {
            super(message, 401, code);
        }
        public AuthenticationException(String message) {
            super(message, 401, null);
        }
    }

    /**
     * Exception thrown when validation fails (HTTP 400)
     */
    public static class ValidationException extends TurboDocxException {
        public ValidationException(String message, String code) {
            super(message, 400, code);
        }
        public ValidationException(String message) {
            super(message, 400, null);
        }
    }

    /**
     * Exception thrown when resource is not found (HTTP 404)
     */
    public static class NotFoundException extends TurboDocxException {
        public NotFoundException(String message, String code) {
            super(message, 404, code);
        }
        public NotFoundException(String message) {
            super(message, 404, null);
        }
    }

    /**
     * Exception thrown when rate limit is exceeded (HTTP 429)
     */
    public static class RateLimitException extends TurboDocxException {
        public RateLimitException(String message, String code) {
            super(message, 429, code);
        }
        public RateLimitException(String message) {
            super(message, 429, null);
        }
    }

    /**
     * Exception thrown when a network error occurs
     */
    public static class NetworkException extends TurboDocxException {
        public NetworkException(String message) {
            super(message, 0, null);
        }
    }
}
