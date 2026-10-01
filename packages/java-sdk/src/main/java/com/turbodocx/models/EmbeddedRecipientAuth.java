package com.turbodocx.models;

/**
 * Per-recipient identity check for embedded signing, in ergonomic shorthand. Expands to the
 * recipient's {@link IdentityVerification}. Leave both unset for no identity verification.
 *
 * <p>{@code emailOtp} wins if both are set (matching the JS resolution order).
 */
public class EmbeddedRecipientAuth {
    /** Require an email OTP before signing. Maps to identityVerification {mode:'otp', channel:'email'}. */
    private final boolean emailOtp;

    /** Require an SMS OTP to this number. Maps to identityVerification {mode:'otp', channel:'sms'} + phone. */
    private final Sms sms;

    private EmbeddedRecipientAuth(Builder builder) {
        this.emailOtp = builder.emailOtp;
        this.sms = builder.sms;
    }

    /** Convenience: email OTP only. */
    public static EmbeddedRecipientAuth emailOtp() {
        return new Builder().emailOtp(true).build();
    }

    /** Convenience: SMS OTP to the given E.164 number. */
    public static EmbeddedRecipientAuth sms(String phoneNumber) {
        return new Builder().sms(new Sms(phoneNumber)).build();
    }

    public boolean isEmailOtp() {
        return emailOtp;
    }

    public Sms getSms() {
        return sms;
    }

    /** SMS OTP target number. */
    public static class Sms {
        private final String phoneNumber;

        public Sms(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }
    }

    public static class Builder {
        private boolean emailOtp;
        private Sms sms;

        public Builder emailOtp(boolean emailOtp) {
            this.emailOtp = emailOtp;
            return this;
        }

        public Builder sms(Sms sms) {
            this.sms = sms;
            return this;
        }

        public Builder sms(String phoneNumber) {
            this.sms = new Sms(phoneNumber);
            return this;
        }

        public EmbeddedRecipientAuth build() {
            return new EmbeddedRecipientAuth(this);
        }
    }
}
