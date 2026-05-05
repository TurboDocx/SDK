package com.turbodocx.models.quote;

/**
 * Generic envelope for single-entity responses.
 * Backend returns { result: T, message?: string } after smart unwrap.
 */
public class ResultEnvelope<T> {
    private T result;
    private String message;

    public T getResult() {
        return result;
    }

    public String getMessage() {
        return message;
    }
}
