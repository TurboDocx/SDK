package com.turbodocx.models;

/**
 * A field of a template's saved signature setup that is anchored to a tag like
 * {@code {ClientSign}}. Listed in {@link TemplateSignatureSetup#getAnchors()}.
 */
public class TemplateSignatureAnchor {
    private String fieldId;
    private String roleKey;
    private String type;
    private String anchor;
    private String placement;
    private Field.Offset offset;
    private Field.Size size;
    private boolean notFound;

    /**
     * The id to pass to {@code TurboSign.removeTemplateSignatureAnchor}. Null on older setups.
     */
    public String getFieldId() {
        return fieldId;
    }

    /** The key of the role that fills this field. */
    public String getRoleKey() {
        return roleKey;
    }

    /** The field type, e.g. {@code signature} or {@code date}. */
    public String getType() {
        return type;
    }

    /** The tag, in single braces. */
    public String getAnchor() {
        return anchor;
    }

    /** Where the field sits relative to its tag: replace, before, after, above or below. */
    public String getPlacement() {
        return placement;
    }

    /** Offset from the tag, or null when none is saved. */
    public Field.Offset getOffset() {
        return offset;
    }

    /** Field size, or null when none is saved. */
    public Field.Size getSize() {
        return size;
    }

    /** True when the template has no variable (Word/PowerPoint) or text (PDF) with this tag. */
    public boolean isNotFound() {
        return notFound;
    }
}
