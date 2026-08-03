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

        @SerializedName("sentOn")
        private String sentOn;

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

        /** When the document was dispatched to recipients; null while it is still a draft. */
        public String getSentOn() {
            return sentOn;
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

        @SerializedName("effectiveStatus")
        private String effectiveStatus;

        @SerializedName("signedOn")
        private String signedOn;

        @SerializedName("signingOrder")
        private int signingOrder;

        @SerializedName("delivery")
        private RecipientDelivery delivery;

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }

        /** Raw database status — only ever {@code pending}, {@code viewed} or {@code completed}. */
        public String getStatus() {
            return status;
        }

        /**
         * Raw status with the document's terminal state layered on: {@code pending},
         * {@code viewed}, {@code completed}, {@code voided} or {@code expired}. Use this for
         * display — a signer on a voided document reads {@code voided} here but still
         * {@code pending} in {@link #getStatus()}. A completed signature is never revoked.
         */
        public String getEffectiveStatus() {
            return effectiveStatus;
        }

        /** When this recipient completed signing; null while pending or viewed. */
        public String getSignedOn() {
            return signedOn;
        }

        public int getSigningOrder() {
            return signingOrder;
        }

        /** Email history for this recipient. */
        public RecipientDelivery getDelivery() {
            return delivery;
        }
    }

    /**
     * Email history for one recipient — every notification actually sent to them.
     * CC notifications are excluded; a CC address is not a signer.
     */
    public static class RecipientDelivery {
        @SerializedName("firstSentOn")
        private String firstSentOn;

        @SerializedName("lastSentOn")
        private String lastSentOn;

        @SerializedName("totalSent")
        private int totalSent;

        @SerializedName("reminderCount")
        private int reminderCount;

        @SerializedName("lastRemindedAt")
        private String lastRemindedAt;

        @SerializedName("warningCount")
        private int warningCount;

        @SerializedName("lastWarningAt")
        private String lastWarningAt;

        /** First email of any kind to this recipient; null if they have never been emailed. */
        public String getFirstSentOn() {
            return firstSentOn;
        }

        /** Most recent email of any kind to this recipient. */
        public String getLastSentOn() {
            return lastSentOn;
        }

        /** Total emails sent (request, resends, reminders, warnings, terminal notices). */
        public int getTotalSent() {
            return totalSent;
        }

        public int getReminderCount() {
            return reminderCount;
        }

        public String getLastRemindedAt() {
            return lastRemindedAt;
        }

        public int getWarningCount() {
            return warningCount;
        }

        public String getLastWarningAt() {
            return lastWarningAt;
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

        @SerializedName("voided")
        private int voided;

        @SerializedName("expired")
        private int expired;

        @SerializedName("waitingOn")
        private int waitingOn;

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

        /** Signers stranded by a voided document. */
        public int getVoided() {
            return voided;
        }

        /** Signers stranded by an expired document. */
        public int getExpired() {
            return expired;
        }

        /** Recipients who can still act (pending + viewed). Zero once the document is terminal. */
        public int getWaitingOn() {
            return waitingOn;
        }
    }
}
