package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * An identity assertion from your own provider, passed when requesting an external_idv signing URL.
 *
 * <p>The four leading fields are required. The rest are optional context recorded on the
 * certificate / audit trail; leave them unset (null) to omit them from the request.
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

    /**
     * How your provider verified the signer: "id_document", "id_document_liveness", "kba",
     * "database", "sso" or "other" (describe "other" in {@code methodDetail}).
     */
    @SerializedName("method")
    private final String method;

    /** Free-text description of the method. Required when {@code method} is "other". */
    @SerializedName("methodDetail")
    private final String methodDetail;

    /**
     * The assurance level your provider attests to, e.g. "ial2_aal2" (NIST 800-63),
     * "eidas_substantial" or "eidas_high".
     */
    @SerializedName("assuranceLevel")
    private final String assuranceLevel;

    /** The signer's legal name as verified by your provider. */
    @SerializedName("verifiedName")
    private final String verifiedName;

    /** An https link to your provider's verification record. */
    @SerializedName("evidenceUrl")
    private final String evidenceUrl;

    /**
     * True skips the check that {@code subjectEmail} equals the recipient's email. Set it only when
     * you have confirmed the verified identity is this signer although the emails differ; the
     * override is recorded on the audit trail.
     */
    @SerializedName("overrideEmailMatching")
    private final Boolean overrideEmailMatching;

    public IdentityAssertion(String provider, String verificationId, String verifiedAt, String subjectEmail) {
        this(provider, verificationId, verifiedAt, subjectEmail, null, null, null, null, null, null);
    }

    public IdentityAssertion(String provider, String verificationId, String verifiedAt, String subjectEmail,
                             String method, String methodDetail, String assuranceLevel, String verifiedName,
                             String evidenceUrl, Boolean overrideEmailMatching) {
        this.provider = provider;
        this.verificationId = verificationId;
        this.verifiedAt = verifiedAt;
        this.subjectEmail = subjectEmail;
        this.method = method;
        this.methodDetail = methodDetail;
        this.assuranceLevel = assuranceLevel;
        this.verifiedName = verifiedName;
        this.evidenceUrl = evidenceUrl;
        this.overrideEmailMatching = overrideEmailMatching;
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

    public String getMethod() {
        return method;
    }

    public String getMethodDetail() {
        return methodDetail;
    }

    public String getAssuranceLevel() {
        return assuranceLevel;
    }

    public String getVerifiedName() {
        return verifiedName;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public Boolean getOverrideEmailMatching() {
        return overrideEmailMatching;
    }

    public static class Builder {
        private String provider;
        private String verificationId;
        private String verifiedAt;
        private String subjectEmail;
        private String method;
        private String methodDetail;
        private String assuranceLevel;
        private String verifiedName;
        private String evidenceUrl;
        private Boolean overrideEmailMatching;

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

        public Builder method(String method) {
            this.method = method;
            return this;
        }

        public Builder methodDetail(String methodDetail) {
            this.methodDetail = methodDetail;
            return this;
        }

        public Builder assuranceLevel(String assuranceLevel) {
            this.assuranceLevel = assuranceLevel;
            return this;
        }

        public Builder verifiedName(String verifiedName) {
            this.verifiedName = verifiedName;
            return this;
        }

        public Builder evidenceUrl(String evidenceUrl) {
            this.evidenceUrl = evidenceUrl;
            return this;
        }

        public Builder overrideEmailMatching(Boolean overrideEmailMatching) {
            this.overrideEmailMatching = overrideEmailMatching;
            return this;
        }

        public IdentityAssertion build() {
            return new IdentityAssertion(provider, verificationId, verifiedAt, subjectEmail,
                    method, methodDetail, assuranceLevel, verifiedName, evidenceUrl, overrideEmailMatching);
        }
    }
}
