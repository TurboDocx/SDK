package com.turbodocx.models;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Request for {@code TurboSign.addTemplateSignatureAnchor}: an anchored field for one signer role
 * of a template's saved signature setup. Anchor pattern and enum values are validated by the API.
 */
public class AddTemplateSignatureAnchorRequest {
    private final String templateId;
    private final String roleKey;
    private final String type;
    private final String anchor;
    private final Field.Size size;
    private final Field.Offset offset;
    private final String placement;
    private final String defaultValue;
    private final Boolean isReadonly;

    private AddTemplateSignatureAnchorRequest(Builder builder) {
        this.templateId = builder.templateId;
        this.roleKey = builder.roleKey;
        this.type = builder.type;
        this.anchor = builder.anchor;
        this.size = builder.size;
        this.offset = builder.offset;
        this.placement = builder.placement;
        this.defaultValue = builder.defaultValue;
        this.isReadonly = builder.isReadonly;
    }

    public String getTemplateId() {
        return templateId;
    }

    public String getRoleKey() {
        return roleKey;
    }

    public String getType() {
        return type;
    }

    public String getAnchor() {
        return anchor;
    }

    public Field.Size getSize() {
        return size;
    }

    public Field.Offset getOffset() {
        return offset;
    }

    public String getPlacement() {
        return placement;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public Boolean getIsReadonly() {
        return isReadonly;
    }

    /** The JSON body: every set key except {@code templateId}, which goes in the path. */
    public Map<String, Object> toBody() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("roleKey", roleKey);
        body.put("type", type);
        body.put("anchor", anchor);
        body.put("size", size);
        body.put("offset", offset);
        body.put("placement", placement);
        body.put("defaultValue", defaultValue);
        body.put("isReadonly", isReadonly);
        body.values().removeIf(value -> value == null); // unset keys are left out
        return body;
    }

    public static class Builder {
        private String templateId;
        private String roleKey;
        private String type;
        private String anchor;
        private Field.Size size;
        private Field.Offset offset;
        private String placement;
        private String defaultValue;
        private Boolean isReadonly;

        /** The template whose saved signature setup gets the field. */
        public Builder templateId(String templateId) {
            this.templateId = templateId;
            return this;
        }

        /**
         * The role's key, as listed by {@code TurboSign.getTemplateSignatureSetup}. On a template
         * with no signer yet, {@code signer_1} creates the first signer.
         */
        public Builder roleKey(String roleKey) {
            this.roleKey = roleKey;
            return this;
        }

        /** The field type, e.g. {@code signature}, {@code initials}, {@code date}, {@code text}. */
        public Builder type(String type) {
            this.type = type;
            return this;
        }

        /** One tag in single braces with no spaces, like {@code {ClientSign}}. */
        public Builder anchor(String anchor) {
            this.anchor = anchor;
            return this;
        }

        public Builder size(Field.Size size) {
            this.size = size;
            return this;
        }

        public Builder offset(Field.Offset offset) {
            this.offset = offset;
            return this;
        }

        /** Where the field sits relative to its tag: replace, before, after, above or below. */
        public Builder placement(String placement) {
            this.placement = placement;
            return this;
        }

        public Builder defaultValue(String defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        /** A read-only field needs a default value, its own or its role's. */
        public Builder isReadonly(Boolean isReadonly) {
            this.isReadonly = isReadonly;
            return this;
        }

        public AddTemplateSignatureAnchorRequest build() {
            return new AddTemplateSignatureAnchorRequest(this);
        }
    }
}
