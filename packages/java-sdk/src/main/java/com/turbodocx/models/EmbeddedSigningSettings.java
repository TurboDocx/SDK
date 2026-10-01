package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

/**
 * The org's embedded-signing configuration, read via
 * {@code TurboSign.getEmbeddedSigningSettings()}.
 *
 * <p>These are the set-once, org-wide GATES plus the default channel. The per-recipient identity
 * mode is chosen when you create each recipient (see {@link IdentityVerification}), not here.
 */
public class EmbeddedSigningSettings {
    /** Embedded signing (and OTP identity verification) is turned on for the org. */
    @SerializedName("enabled")
    private boolean enabled;

    /** You may assert a signer's identity with your own provider (external_idv). */
    @SerializedName("allowExternalIdv")
    private boolean allowExternalIdv;

    /** A sender may issue a link that skips identity verification (override; development/testing). */
    @SerializedName("allowIdentityOverride")
    private boolean allowIdentityOverride;

    /**
     * The org's default OTP channel ({@code "none"}, {@code "email"}, {@code "sms"}). While embedded
     * signing is enabled it applies to every recipient that doesn't set one, SDK/API sends included.
     * {@code "none"} means verify only when a request asks for it. See
     * {@link #getAllowChannelOverride()} for whether you may pick a different one. May be null if the
     * backend omits it.
     */
    @SerializedName("defaultChannel")
    private String defaultChannel;

    /**
     * Whether a request may give a recipient a channel other than {@code defaultChannel}.
     * {@code false} means the org locked the method: an explicit different channel is rejected with
     * {@code OtpOverrideNotAllowed}, so omit it to take the default. Always {@code true} for a
     * {@code "none"} default or when embedded signing is off. Null when the API did not report it.
     */
    @SerializedName("allowChannelOverride")
    private Boolean allowChannelOverride;

    /** Origins allowed to embed the signing page in an iframe. Empty means framing is denied everywhere. */
    @SerializedName("allowedFrameAncestors")
    private List<String> allowedFrameAncestors;

    public boolean isEnabled() {
        return enabled;
    }

    public boolean isAllowExternalIdv() {
        return allowExternalIdv;
    }

    public boolean isAllowIdentityOverride() {
        return allowIdentityOverride;
    }

    public String getDefaultChannel() {
        return defaultChannel;
    }

    public Boolean getAllowChannelOverride() {
        return allowChannelOverride;
    }

    public List<String> getAllowedFrameAncestors() {
        return allowedFrameAncestors;
    }
}
