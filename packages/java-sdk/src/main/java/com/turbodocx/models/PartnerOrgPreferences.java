package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * The partner-settable slice of an organization's TurboSign display preferences.
 *
 * <p>When read, every key is present with its effective boolean value (defaults
 * applied for keys the org never set). When used as an update body, leave a field
 * null to omit it -- only non-null keys are sent, so a partner changes just the
 * keys it wants. Widening this class later (as the backend allowlist grows) is
 * additive and non-breaking.</p>
 *
 * <p>JSON keys are camelCase verbatim -- they are not re-cased.</p>
 */
public class PartnerOrgPreferences {
    @SerializedName("hideSignatureOutline")
    private Boolean hideSignatureOutline;

    @SerializedName("hideSignatureHash")
    private Boolean hideSignatureHash;

    @SerializedName("lockedFieldsBackground")
    private Boolean lockedFieldsBackground;

    @SerializedName("allowDownloadBeforeSigning")
    private Boolean allowDownloadBeforeSigning;

    public PartnerOrgPreferences() {
    }

    public Boolean getHideSignatureOutline() {
        return hideSignatureOutline;
    }

    public PartnerOrgPreferences setHideSignatureOutline(Boolean hideSignatureOutline) {
        this.hideSignatureOutline = hideSignatureOutline;
        return this;
    }

    public Boolean getHideSignatureHash() {
        return hideSignatureHash;
    }

    public PartnerOrgPreferences setHideSignatureHash(Boolean hideSignatureHash) {
        this.hideSignatureHash = hideSignatureHash;
        return this;
    }

    public Boolean getLockedFieldsBackground() {
        return lockedFieldsBackground;
    }

    public PartnerOrgPreferences setLockedFieldsBackground(Boolean lockedFieldsBackground) {
        this.lockedFieldsBackground = lockedFieldsBackground;
        return this;
    }

    public Boolean getAllowDownloadBeforeSigning() {
        return allowDownloadBeforeSigning;
    }

    public PartnerOrgPreferences setAllowDownloadBeforeSigning(Boolean allowDownloadBeforeSigning) {
        this.allowDownloadBeforeSigning = allowDownloadBeforeSigning;
        return this;
    }
}
