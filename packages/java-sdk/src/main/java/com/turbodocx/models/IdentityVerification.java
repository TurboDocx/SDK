package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * How an embedded recipient's identity is verified before they can sign.
 *
 * <p>Mirrors the JS discriminated union on {@code mode}. Rather than a class hierarchy, this is a
 * single POJO whose unused fields stay null and are omitted by Gson, so each mode serializes to
 * exactly the shape the backend expects:
 * <ul>
 *   <li>{@code otp} — {@code {mode:"otp", channel:"email"|"sms"}}. TurboSign emails or texts a
 *       one-time passcode (SMS requires {@code phone} on the recipient).</li>
 *   <li>{@code external_idv} — {@code {mode:"external_idv", provider, maxAgeMinutes?}}. Your own
 *       identity provider verifies the signer; pass the assertion to
 *       {@code TurboSign.createSigningUrl} when you request the signing URL.</li>
 *   <li>{@code override} — {@code {mode:"override", overrideIdentityVerification:true, reason}}.
 *       Skips identity verification entirely (development/testing); the signature is marked
 *       "not identity-verified".</li>
 * </ul>
 *
 * <p>Use the static factory methods rather than the constructor.
 */
public class IdentityVerification {
    @SerializedName("mode")
    private final String mode;

    @SerializedName("channel")
    private final String channel;

    @SerializedName("provider")
    private final String provider;

    @SerializedName("maxAgeMinutes")
    private final Integer maxAgeMinutes;

    @SerializedName("overrideIdentityVerification")
    private final Boolean overrideIdentityVerification;

    @SerializedName("reason")
    private final String reason;

    private IdentityVerification(String mode, String channel, String provider, Integer maxAgeMinutes,
                                 Boolean overrideIdentityVerification, String reason) {
        this.mode = mode;
        this.channel = channel;
        this.provider = provider;
        this.maxAgeMinutes = maxAgeMinutes;
        this.overrideIdentityVerification = overrideIdentityVerification;
        this.reason = reason;
    }

    /** One-time passcode over the given channel ({@code "email"} or {@code "sms"}). */
    public static IdentityVerification otp(String channel) {
        return new IdentityVerification("otp", channel, null, null, null, null);
    }

    /** Email one-time passcode. */
    public static IdentityVerification otpEmail() {
        return otp("email");
    }

    /** SMS one-time passcode (recipient must carry an E.164 phone). */
    public static IdentityVerification otpSms() {
        return otp("sms");
    }

    /** Verification by your own identity provider. */
    public static IdentityVerification externalIdv(String provider) {
        return new IdentityVerification("external_idv", null, provider, null, null, null);
    }

    /** Verification by your own identity provider, with a maximum assertion age. */
    public static IdentityVerification externalIdv(String provider, Integer maxAgeMinutes) {
        return new IdentityVerification("external_idv", null, provider, maxAgeMinutes, null, null);
    }

    /**
     * Skip identity verification. The acknowledgement flag is always sent as {@code true}; the
     * reason is recorded on the certificate.
     */
    public static IdentityVerification override(String reason) {
        return new IdentityVerification("override", null, null, null, Boolean.TRUE, reason);
    }

    public String getMode() {
        return mode;
    }

    public String getChannel() {
        return channel;
    }

    public String getProvider() {
        return provider;
    }

    public Integer getMaxAgeMinutes() {
        return maxAgeMinutes;
    }

    public Boolean getOverrideIdentityVerification() {
        return overrideIdentityVerification;
    }

    public String getReason() {
        return reason;
    }
}
