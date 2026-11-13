package com.turbodocx.models;

import java.util.Collections;
import java.util.List;

/**
 * A template's signer roles, for sending it with each recipient's {@code role}. Returned by
 * {@code TurboSign.getTemplateSignatureSetup}.
 */
public class TemplateSignatureSetup {
    private String templateId;
    private List<TemplateSignatureRole> roles;
    private List<TemplateSignatureAnchor> anchors;

    public String getTemplateId() {
        return templateId;
    }

    /** Roles in signing order. */
    public List<TemplateSignatureRole> getRoles() {
        return roles;
    }

    /**
     * The setup's anchored fields: fields tied to a template tag like {@code {ClientSign}}. Never
     * null: empty when the backend sends none (an older backend does not send the list at all).
     */
    public List<TemplateSignatureAnchor> getAnchors() {
        return anchors == null ? Collections.emptyList() : anchors;
    }
}
