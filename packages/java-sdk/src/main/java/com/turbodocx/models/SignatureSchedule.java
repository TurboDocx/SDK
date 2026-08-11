package com.turbodocx.models;

/**
 * Per-document reminder + expiration overrides.
 *
 * <p>Every field is a boxed type so {@code null} stays distinguishable from a deliberate
 * {@code false} or {@code 0}: reminders-off, a cap of 0 (no reminders) and a cap of -1
 * (unlimited) are all meaningful, and a primitive's default would silently fall back to the
 * organization's default — the opposite of what the caller asked for.
 *
 * <p>An omitted field inherits the org default; omitting the whole schedule means "use the org
 * policy as it stands at send time". Both reminders and expiration are off by default.
 */
public class SignatureSchedule {

    /** A configured length of time. The unit is carried alongside the value, not normalised away. */
    public static class Duration {
        private final int value;
        private final String unit;

        /**
         * @param value whole number of units; minimum 1, except an expiration warning where 0
         *              means "never warn"
         * @param unit  "hours" or "days"
         */
        public Duration(int value, String unit) {
            this.value = value;
            this.unit = unit;
        }

        public int getValue() {
            return value;
        }

        public String getUnit() {
            return unit;
        }
    }

    private final Boolean remindersEnabled;
    private final Duration reminderDelay;
    private final Duration reminderInterval;
    private final Integer maxReminders;
    private final Boolean expirationEnabled;
    private final Duration expireAfter;
    private final Duration expirationWarning;
    private final Duration expirationWarningInterval;

    private SignatureSchedule(Builder builder) {
        this.remindersEnabled = builder.remindersEnabled;
        this.reminderDelay = builder.reminderDelay;
        this.reminderInterval = builder.reminderInterval;
        this.maxReminders = builder.maxReminders;
        this.expirationEnabled = builder.expirationEnabled;
        this.expireAfter = builder.expireAfter;
        this.expirationWarning = builder.expirationWarning;
        this.expirationWarningInterval = builder.expirationWarningInterval;
    }

    public Boolean getRemindersEnabled() {
        return remindersEnabled;
    }

    public Duration getReminderDelay() {
        return reminderDelay;
    }

    public Duration getReminderInterval() {
        return reminderInterval;
    }

    public Integer getMaxReminders() {
        return maxReminders;
    }

    public Boolean getExpirationEnabled() {
        return expirationEnabled;
    }

    public Duration getExpireAfter() {
        return expireAfter;
    }

    public Duration getExpirationWarning() {
        return expirationWarning;
    }

    public Duration getExpirationWarningInterval() {
        return expirationWarningInterval;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Boolean remindersEnabled;
        private Duration reminderDelay;
        private Duration reminderInterval;
        private Integer maxReminders;
        private Boolean expirationEnabled;
        private Duration expireAfter;
        private Duration expirationWarning;
        private Duration expirationWarningInterval;

        /** Send reminder emails to signers who haven't signed yet. */
        public Builder remindersEnabled(Boolean remindersEnabled) {
            this.remindersEnabled = remindersEnabled;
            return this;
        }

        /** How long after the invitation before the FIRST reminder. */
        public Builder reminderDelay(Duration reminderDelay) {
            this.reminderDelay = reminderDelay;
            return this;
        }

        /** Gap between subsequent reminders. */
        public Builder reminderInterval(Duration reminderInterval) {
            this.reminderInterval = reminderInterval;
            return this;
        }

        /** Cap per signer. -1 means unlimited, 0 means none. Never caps expiry warnings. */
        public Builder maxReminders(Integer maxReminders) {
            this.maxReminders = maxReminders;
            return this;
        }

        /** Close the signing window after {@code expireAfter}. */
        public Builder expirationEnabled(Boolean expirationEnabled) {
            this.expirationEnabled = expirationEnabled;
            return this;
        }

        /** How long the document stays signable, counted from sending. */
        public Builder expireAfter(Duration expireAfter) {
            this.expireAfter = expireAfter;
            return this;
        }

        /** How far BEFORE expiry warnings start. A zero value means no warnings at all. */
        public Builder expirationWarning(Duration expirationWarning) {
            this.expirationWarning = expirationWarning;
            return this;
        }

        /** Gap between warnings once the warning window is open. */
        public Builder expirationWarningInterval(Duration expirationWarningInterval) {
            this.expirationWarningInterval = expirationWarningInterval;
            return this;
        }

        public SignatureSchedule build() {
            return new SignatureSchedule(this);
        }
    }
}
