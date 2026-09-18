package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * An identity assertion from your own provider, passed when requesting an external_idv signing URL.
 */
public class IdentityAssertion {
    /** Must match the recipient's configured provider. */
    @SerializedName("provider")
    private final String provider;

    /** Your provider's unique id for this verification (used to detect replay). */
    @SerializedName("verificationId")
    private final String verificationId;

    /** When your provider verified the signer (ISO 8601). Rejected if in the future or too old. */
    @SerializedName("verifiedAt")
    private final String verifiedAt;

    /** The email your provider verified — must match the recipient's email. */
    @SerializedName("subjectEmail")
    private final String subjectEmail;

    public IdentityAssertion(String provider, String verificationId, String verifiedAt, String subjectEmail) {
        this.provider = provider;
        this.verificationId = verificationId;
        this.verifiedAt = verifiedAt;
        this.subjectEmail = subjectEmail;
    }

    public String getProvider() {
        return provider;
    }

    public String getVerificationId() {
        return verificationId;
    }

    public String getVerifiedAt() {
        return verifiedAt;
    }

    public String getSubjectEmail() {
        return subjectEmail;
    }

    public static class Builder {
        private String provider;
        private String verificationId;
        private String verifiedAt;
        private String subjectEmail;

        public Builder provider(String provider) {
            this.provider = provider;
            return this;
        }

        public Builder verificationId(String verificationId) {
            this.verificationId = verificationId;
            return this;
        }

        public Builder verifiedAt(String verifiedAt) {
            this.verifiedAt = verifiedAt;
            return this;
        }

        public Builder subjectEmail(String subjectEmail) {
            this.subjectEmail = subjectEmail;
            return this;
        }

        public IdentityAssertion build() {
            return new IdentityAssertion(provider, verificationId, verifiedAt, subjectEmail);
        }
    }
}
