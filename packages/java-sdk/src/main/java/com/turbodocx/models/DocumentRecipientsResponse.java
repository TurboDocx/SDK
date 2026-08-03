package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

/**
 * Response from getting a document's recipients with their per-recipient signing status.
 *
 * <p>Recipient status is one of {@code pending}, {@code viewed} or {@code completed}. There is
 * no per-recipient declined/expired/voided state, so on a voided or expired document every
 * unsigned recipient still reads {@code pending} — read {@link RecipientsDocument#getStatus()}
 * to tell "still waiting" apart from "this document is dead".
 */
public class DocumentRecipientsResponse {
    @SerializedName("document")
    private RecipientsDocument document;

    @SerializedName("recipients")
    private List<RecipientStatus> recipients;

    @SerializedName("summary")
    private RecipientStatusSummary summary;

    public RecipientsDocument getDocument() {
        return document;
    }

    public List<RecipientStatus> getRecipients() {
        return recipients;
    }

    public RecipientStatusSummary getSummary() {
        return summary;
    }

    /**
     * The document the recipients belong to.
     */
    public static class RecipientsDocument {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        @SerializedName("status")
        private String status;

        @SerializedName("createdOn")
        private String createdOn;

        @SerializedName("expiresAt")
        private String expiresAt;

        @SerializedName("sentBy")
        private Sender sentBy;

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        /** Document-level status, e.g. {@code under_review}, {@code completed}, {@code voided}. */
        public String getStatus() {
            return status;
        }

        public String getCreatedOn() {
            return createdOn;
        }

        /** When the signing window closes; null when the document never expires. */
        public String getExpiresAt() {
            return expiresAt;
        }

        /** Who sent the document — never the synthetic API service account. */
        public Sender getSentBy() {
            return sentBy;
        }
    }

    /**
     * The identity that sent the document for signature.
     */
    public static class Sender {
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

    /**
     * A single recipient and where they are in the signing process.
     */
    public static class RecipientStatus {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        @SerializedName("email")
        private String email;

        @SerializedName("status")
        private String status;

        @SerializedName("signedOn")
        private String signedOn;

        @SerializedName("signingOrder")
        private int signingOrder;

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }

        /** One of {@code pending}, {@code viewed}, {@code completed}. */
        public String getStatus() {
            return status;
        }

        /** When this recipient completed signing; null while pending or viewed. */
        public String getSignedOn() {
            return signedOn;
        }

        public int getSigningOrder() {
            return signingOrder;
        }
    }

    /**
     * Roll-up of the roster so callers can answer "how many are we waiting on" without looping.
     */
    public static class RecipientStatusSummary {
        @SerializedName("total")
        private int total;

        @SerializedName("pending")
        private int pending;

        @SerializedName("viewed")
        private int viewed;

        @SerializedName("completed")
        private int completed;

        public int getTotal() {
            return total;
        }

        public int getPending() {
            return pending;
        }

        public int getViewed() {
            return viewed;
        }

        public int getCompleted() {
            return completed;
        }
    }
}
