package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import java.util.Map;

/**
 * Response from getting audit trail
 */
public class AuditTrailResponse {
    @SerializedName("documentId")
    private String documentId;

    @SerializedName("entries")
    private List<AuditTrailEntry> entries;

    public String getDocumentId() {
        return documentId;
    }

    public List<AuditTrailEntry> getEntries() {
        return entries;
    }

    /**
     * Single audit trail entry
     */
    public static class AuditTrailEntry {
        @SerializedName("event")
        private String event;

        @SerializedName("actor")
        private String actor;

        @SerializedName("timestamp")
        private String timestamp;

        @SerializedName("ipAddress")
        private String ipAddress;

        @SerializedName("details")
        private Map<String, Object> details;

        public String getEvent() {
            return event;
        }

        public String getActor() {
            return actor;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public String getIpAddress() {
            return ipAddress;
        }

        public Map<String, Object> getDetails() {
            return details;
        }
    }
}
