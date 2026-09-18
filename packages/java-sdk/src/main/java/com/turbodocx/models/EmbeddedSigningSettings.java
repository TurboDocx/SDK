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
     * Default OTP channel applied to recipients that do not specify one, on the interactive (UI)
     * create path only ({@code "none"}, {@code "email"}, {@code "sms"}). May be null if the backend
     * omits it.
     */
    @SerializedName("defaultChannel")
    private String defaultChannel;

    /** Origins allowed to embed the signing page in an iframe (empty = no restriction configured). */
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

    public List<String> getAllowedFrameAncestors() {
        return allowedFrameAncestors;
    }
}
