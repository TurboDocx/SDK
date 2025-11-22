package com.turbodocx;

/**
 * Exception thrown when TurboDocx API returns an error
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

    public int getStatusCode() {
        return statusCode;
    }

    public String getCode() {
        return code;
    }
}
