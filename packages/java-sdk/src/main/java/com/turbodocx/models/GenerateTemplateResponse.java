package com.turbodocx.models;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response from template generation
 */
public class GenerateTemplateResponse {
    @JsonProperty("success")
    private boolean success;

    @JsonProperty("deliverableId")
    private String deliverableId;

    @JsonProperty("buffer")
    private byte[] buffer;

    @JsonProperty("downloadUrl")
    private String downloadUrl;

    @JsonProperty("message")
    private String message;

    @JsonProperty("error")
    private String error;

    // Constructors
    public GenerateTemplateResponse() {
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getDeliverableId() {
        return deliverableId;
    }

    public void setDeliverableId(String deliverableId) {
        this.deliverableId = deliverableId;
    }

    public byte[] getBuffer() {
        return buffer;
    }

    public void setBuffer(byte[] buffer) {
        this.buffer = buffer;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
