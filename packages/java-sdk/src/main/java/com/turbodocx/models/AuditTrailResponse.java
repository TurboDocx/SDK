package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import java.util.Map;

/**
 * Response from getting audit trail
 */
public class AuditTrailResponse {
    @SerializedName("document")
    private DocumentInfo document;

    @SerializedName("auditTrail")
    private List<AuditTrailEntry> auditTrail;

    public DocumentInfo getDocument() {
        return document;
    }

    public String getDocumentId() {
        return document != null ? document.getId() : null;
    }

    public List<AuditTrailEntry> getAuditTrail() {
        return auditTrail;
    }

    // Alias for backwards compatibility
    public List<AuditTrailEntry> getEntries() {
        return auditTrail;
    }

    /**
     * Document info in audit trail response
     */
    public static class DocumentInfo {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        public String getId() { return id; }
        public String getName() { return name; }
    }

    /**
     * Single audit trail entry
     */
    public static class AuditTrailEntry {
        @SerializedName("id")
        private String id;

        @SerializedName("documentId")
        private String documentId;

        @SerializedName("actionType")
        private String actionType;

        @SerializedName("timestamp")
        private String timestamp;

        @SerializedName("details")
        private Map<String, Object> details;

        @SerializedName("user")
        private UserInfo user;

        @SerializedName("recipient")
        private RecipientInfo recipient;

        public String getId() { return id; }
        public String getDocumentId() { return documentId; }
        public String getActionType() { return actionType; }
        public String getTimestamp() { return timestamp; }
        public Map<String, Object> getDetails() { return details; }
        public UserInfo getUser() { return user; }
        public RecipientInfo getRecipient() { return recipient; }

        // Alias for backwards compatibility
        public String getEvent() { return actionType; }
    }

    /**
     * User info in audit entry
     */
    public static class UserInfo {
        @SerializedName("name")
        private String name;

        @SerializedName("email")
        private String email;

        public String getName() { return name; }
        public String getEmail() { return email; }
    }

    /**
     * Recipient info in audit entry
     */
    public static class RecipientInfo {
        @SerializedName("name")
        private String name;

        @SerializedName("email")
        private String email;

        public String getName() { return name; }
        public String getEmail() { return email; }
    }
}
