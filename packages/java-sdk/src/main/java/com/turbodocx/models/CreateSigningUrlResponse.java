package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

/**
 * The embedded signing URL and its metadata: the reusable signing link for {@code otp} /
 * no-verification recipients, or a single-use link for {@code external_idv} / {@code override}
 * recipients.
 */
public class CreateSigningUrlResponse {
    /** The URL to open (new tab / redirect) or embed for the signer. */
    @SerializedName("url")
    private String url;

    /**
     * When the URL stops working (ISO 8601). Single-use links ({@code external_idv} /
     * {@code override}) expire minutes after issue. For {@code otp}/no-verification recipients the
     * URL is the reusable signing link, so this is the document's own expiry, or null when the
     * document doesn't expire.
     */
    @SerializedName("expiresAt")
    private String expiresAt;

    @SerializedName("recipientId")
    private String recipientId;

    @SerializedName("externalId")
    private String externalId;

    /** One of {@code "otp"}, {@code "external_idv"}, {@code "override"}, or null. */
    @SerializedName("identityVerificationMode")
    private String identityVerificationMode;

    /** Passcode steps the signer must clear on the page ({@code "email_otp"}/{@code "sms_otp"}). */
    @SerializedName("pendingChecks")
    private List<String> pendingChecks;

    public String getUrl() {
        return url;
    }

    public String getExpiresAt() {
        return expiresAt;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public String getExternalId() {
        return externalId;
    }

    public String getIdentityVerificationMode() {
        return identityVerificationMode;
    }

    public List<String> getPendingChecks() {
        return pendingChecks;
    }
}
