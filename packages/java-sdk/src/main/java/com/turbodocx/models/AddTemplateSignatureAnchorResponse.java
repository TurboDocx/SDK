package com.turbodocx.models;

import java.util.Map;

/** Result of {@code TurboSign.addTemplateSignatureAnchor}. */
public class AddTemplateSignatureAnchorResponse {
    private String fieldId;
    private Map<String, Object> signatureSetup;
    private boolean tagBecameSignatureField;

    /** The anchored field's id. */
    public String getFieldId() {
        return fieldId;
    }

    /** The template's saved signature setup as stored ({@code roles}, {@code fields}, ...). */
    public Map<String, Object> getSignatureSetup() {
        return signatureSetup;
    }

    /**
     * True when the tag was not a signature field before; the template's own values for it were
     * cleared.
     */
    public boolean isTagBecameSignatureField() {
        return tagBecameSignatureField;
    }
}
