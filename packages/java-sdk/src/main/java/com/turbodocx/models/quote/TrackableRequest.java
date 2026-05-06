package com.turbodocx.models.quote;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Base class for Update request objects that need to distinguish between
 * "field not set (default null)" and "field explicitly set to null (user wants to clear it)".
 *
 * <p>Each setter in a subclass should call {@link #markFieldSet(String)} to record
 * that the field was explicitly set. The PATCH serialization layer then uses
 * {@link #getSetFields()} to build a JSON body that includes only the fields
 * the caller actually touched — including those set to {@code null}.</p>
 *
 * <p>The {@code setFields} set is marked {@code transient} so Gson ignores it
 * during serialization.</p>
 */
public abstract class TrackableRequest {
    private final transient Set<String> setFields = new HashSet<>();

    /**
     * Mark a field as explicitly set by the caller.
     * Call this in every setter method.
     *
     * @param fieldName the JSON field name (must match the Java field name)
     */
    protected void markFieldSet(String fieldName) {
        setFields.add(fieldName);
    }

    /**
     * Returns the set of field names that were explicitly set via setters.
     *
     * @return unmodifiable set of set field names
     */
    public Set<String> getSetFields() {
        return Collections.unmodifiableSet(setFields);
    }
}
