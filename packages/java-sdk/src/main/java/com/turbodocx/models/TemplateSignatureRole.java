package com.turbodocx.models;

/**
 * One signer role of a template, as returned by {@code TurboSign.getTemplateSignatureSetup}.
 */
public class TemplateSignatureRole {
    private String key;
    private String label;
    private int order;
    private boolean hasSavedSigner;
    private String defaultName;
    private String defaultEmail;
    private int fieldCount;

    /** The value to pass as the recipient's {@code role}. */
    public String getKey() {
        return key;
    }

    /** The role's name in the TurboDocx UI. */
    public String getLabel() {
        return label;
    }

    /** Signing order of this role. */
    public int getOrder() {
        return order;
    }

    /** True when the template has a saved signer for this role, used if you leave the role out. */
    public boolean hasSavedSigner() {
        return hasSavedSigner;
    }

    /** The saved signer's name (only when {@link #hasSavedSigner()}), otherwise null. */
    public String getDefaultName() {
        return defaultName;
    }

    /** The saved signer's email (only when {@link #hasSavedSigner()}), otherwise null. */
    public String getDefaultEmail() {
        return defaultEmail;
    }

    /** How many fields are saved for this role. */
    public int getFieldCount() {
        return fieldCount;
    }
}
