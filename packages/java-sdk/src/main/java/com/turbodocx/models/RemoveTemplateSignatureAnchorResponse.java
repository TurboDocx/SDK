package com.turbodocx.models;

import java.util.Map;

/** Result of {@code TurboSign.removeTemplateSignatureAnchor}. */
public class RemoveTemplateSignatureAnchorResponse {
    private Map<String, Object> signatureSetup;

    /** The template's saved signature setup as stored, without the removed field. */
    public Map<String, Object> getSignatureSetup() {
        return signatureSetup;
    }
}
