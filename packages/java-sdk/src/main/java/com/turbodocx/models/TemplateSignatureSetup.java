package com.turbodocx.models;

import java.util.List;

/**
 * A template's signer roles, for sending it with each recipient's {@code role}. Returned by
 * {@code TurboSign.getTemplateSignatureSetup}.
 */
public class TemplateSignatureSetup {
    private String templateId;
    private List<TemplateSignatureRole> roles;

    public String getTemplateId() {
        return templateId;
    }

    /** Roles in signing order. */
    public List<TemplateSignatureRole> getRoles() {
        return roles;
    }
}
