package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import java.util.Map;

/**
 * Response from getting audit trail
 */
public class AuditTrailResponse {
    @SerializedName("document")
    private AuditTrailDocument document;

    @SerializedName("auditTrail")
    private List<AuditTrailEntry> auditTrail;

    public AuditTrailDocument getDocument() {
        return document;
    }

    public List<AuditTrailEntry> getAuditTrail() {
        return auditTrail;
    }

    /**
     * Document info in audit trail response
     */
    public static class AuditTrailDocument {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }
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

        @SerializedName("previousHash")
        private String previousHash;

        @SerializedName("currentHash")
        private String currentHash;

        @SerializedName("createdOn")
        private String createdOn;

        @SerializedName("details")
        private Map<String, Object> details;

        @SerializedName("user")
        private AuditTrailUser user;

        @SerializedName("userId")
        private String userId;

        @SerializedName("recipient")
        private AuditTrailUser recipient;

        @SerializedName("recipientId")
        private String recipientId;

        public String getId() {
            return id;
        }

        public String getDocumentId() {
            return documentId;
        }

        public String getActionType() {
            return actionType;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public String getPreviousHash() {
            return previousHash;
        }

        public String getCurrentHash() {
            return currentHash;
        }

        public String getCreatedOn() {
            return createdOn;
        }

        public Map<String, Object> getDetails() {
            return details;
        }

        public AuditTrailUser getUser() {
            return user;
        }

        public String getUserId() {
            return userId;
        }

        public AuditTrailUser getRecipient() {
            return recipient;
        }

        public String getRecipientId() {
            return recipientId;
        }
    }

    /**
     * User info in audit trail entry
     */
    public static class AuditTrailUser {
        @SerializedName("name")
        private String name;

        @SerializedName("email")
        private String email;

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }
    }
}
