package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response containing presigned URL for download
 */
public class DownloadResponse {
    @SerializedName("downloadUrl")
    private String downloadUrl;

    @SerializedName("fileName")
    private String fileName;

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public String getFileName() {
        return fileName;
    }
}
