package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response wrapper for reading or updating an organization's partner-settable
 * TurboSign display preferences.
 *
 * <p>Matches the API envelope {@code { success, data: { preferences } }}.</p>
 */
public class PartnerOrgPreferencesResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private Data data;

    public boolean isSuccess() {
        return success;
    }

    public Data getData() {
        return data;
    }

    /**
     * The {@code data} envelope holding the preferences object.
     */
    public static class Data {
        @SerializedName("preferences")
        private PartnerOrgPreferences preferences;

        public PartnerOrgPreferences getPreferences() {
            return preferences;
        }
    }
}
