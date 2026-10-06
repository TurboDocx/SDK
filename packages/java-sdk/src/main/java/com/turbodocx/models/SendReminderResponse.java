package com.turbodocx.models;

import java.util.List;

/**
 * Response from {@code TurboSign.sendReminder}.
 *
 * <p>Carries one entry per recipient considered, including those skipped and why — a later-order
 * signer is reported rather than silently dropped, so the caller can tell nobody was emailed.
 */
public class SendReminderResponse {

    /** Outcome for one recipient of a reminder request. */
    public static class ReminderResult {
        private String recipientId;
        private String status;
        private Integer reminderCount;
        private String phase;

        public String getRecipientId() {
            return recipientId;
        }

        /**
         * e.g. "sent", "skipped_wrong_order", "skipped_completed", or
         * "skipped_requires_single_use_url" for an external_idv or override recipient, who signs
         * only through a single-use createSigningUrl link and is never emailed.
         */
        public String getStatus() {
            return status;
        }

        /** Reminder count after the send; only meaningful when the status is "sent". */
        public Integer getReminderCount() {
            return reminderCount;
        }

        /** Which email was sent — "reminder" or "expiring". */
        public String getPhase() {
            return phase;
        }
    }

    private List<ReminderResult> results;

    public List<ReminderResult> getResults() {
        return results;
    }
}
