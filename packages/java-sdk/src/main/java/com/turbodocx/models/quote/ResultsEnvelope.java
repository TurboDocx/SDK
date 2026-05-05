package com.turbodocx.models.quote;

import java.util.List;

/**
 * Generic envelope for multi-entity responses.
 * Backend returns { results: T[], message?: string } after smart unwrap.
 */
public class ResultsEnvelope<T> {
    private List<T> results;
    private String message;

    public List<T> getResults() {
        return results;
    }

    public String getMessage() {
        return message;
    }
}
