package com.turbodocx.models;

/**
 * One signer in a {@link CreateEmbeddedSignatureRequest}.
 */
public class EmbeddedSignatureRecipient {
    private final String name;
    private final String email;
    private final String phone;
    /** Defaults to the recipient's index + 1 (sequential) when null. */
    private final Integer signingOrder;
    private final EmbeddedRecipientAuth auth;
    private final EmbeddedRecipientFields fields;

    private EmbeddedSignatureRecipient(Builder builder) {
        this.name = builder.name;
        this.email = builder.email;
        this.phone = builder.phone;
        this.signingOrder = builder.signingOrder;
        this.auth = builder.auth;
        this.fields = builder.fields;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public Integer getSigningOrder() {
        return signingOrder;
    }

    public EmbeddedRecipientAuth getAuth() {
        return auth;
    }

    public EmbeddedRecipientFields getFields() {
        return fields;
    }

    public static class Builder {
        private String name;
        private String email;
        private String phone;
        private Integer signingOrder;
        private EmbeddedRecipientAuth auth;
        private EmbeddedRecipientFields fields;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder signingOrder(Integer signingOrder) {
            this.signingOrder = signingOrder;
            return this;
        }

        public Builder auth(EmbeddedRecipientAuth auth) {
            this.auth = auth;
            return this;
        }

        public Builder fields(EmbeddedRecipientFields fields) {
            this.fields = fields;
            return this;
        }

        public EmbeddedSignatureRecipient build() {
            return new EmbeddedSignatureRecipient(this);
        }
    }
}
