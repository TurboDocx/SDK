package com.turbodocx.models;

/**
 * Shorthand field placement by text anchor; expands to full {@link Field} objects
 * (placement {@code replace} + a default size). Each value is the anchor text to replace,
 * e.g. {@code "{signature1}"}. A null key is skipped.
 */
public class EmbeddedRecipientFields {
    private final String signature;
    private final String date;
    private final String initials;
    private final String fullName;

    private EmbeddedRecipientFields(Builder builder) {
        this.signature = builder.signature;
        this.date = builder.date;
        this.initials = builder.initials;
        this.fullName = builder.fullName;
    }

    public String getSignature() {
        return signature;
    }

    public String getDate() {
        return date;
    }

    public String getInitials() {
        return initials;
    }

    public String getFullName() {
        return fullName;
    }

    public static class Builder {
        private String signature;
        private String date;
        private String initials;
        private String fullName;

        public Builder signature(String anchor) {
            this.signature = anchor;
            return this;
        }

        public Builder date(String anchor) {
            this.date = anchor;
            return this;
        }

        public Builder initials(String anchor) {
            this.initials = anchor;
            return this;
        }

        public Builder fullName(String anchor) {
            this.fullName = anchor;
            return this;
        }

        public EmbeddedRecipientFields build() {
            return new EmbeddedRecipientFields(this);
        }
    }
}
