package com.turbodocx;

import com.turbodocx.models.SendSignatureRequest;
import com.turbodocx.models.SignatureSchedule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * TurboSign reminder + expiration schedule tests.
 *
 * <p>Mirrors the js-sdk, py-sdk, go-sdk, php-sdk and ruby-sdk suites, per the cross-SDK
 * test-parity rule.
 *
 * <p>The load-bearing detail these lock in is that every schedule field is a BOXED type. A
 * primitive {@code boolean}/{@code int} could not express "unset", so a deliberate
 * reminders-off or a cap of 0 would be indistinguishable from an omitted field and would
 * silently fall back to the organization's default.
 */
class TurboSignScheduleTest {

    @Test
    @DisplayName("carries every schedule field onto the request")
    void carriesEveryScheduleField() {
        SignatureSchedule schedule = SignatureSchedule.builder()
                .remindersEnabled(true)
                .reminderDelay(new SignatureSchedule.Duration(3, "days"))
                .reminderInterval(new SignatureSchedule.Duration(12, "hours"))
                .maxReminders(5)
                .expirationEnabled(true)
                .expireAfter(new SignatureSchedule.Duration(30, "days"))
                .expirationWarning(new SignatureSchedule.Duration(3, "days"))
                .expirationWarningInterval(new SignatureSchedule.Duration(1, "days"))
                .build();

        assertTrue(schedule.getRemindersEnabled());
        assertEquals(5, schedule.getMaxReminders());
        assertTrue(schedule.getExpirationEnabled());
        assertEquals(3, schedule.getReminderDelay().getValue());
        assertEquals("days", schedule.getReminderDelay().getUnit());
        assertEquals(12, schedule.getReminderInterval().getValue());
        assertEquals("hours", schedule.getReminderInterval().getUnit());
        assertEquals(30, schedule.getExpireAfter().getValue());
        assertEquals(1, schedule.getExpirationWarningInterval().getValue());
    }

    @Test
    @DisplayName("leaves every unset field null so the org default applies")
    void leavesUnsetFieldsNull() {
        SignatureSchedule schedule = SignatureSchedule.builder().build();

        assertNull(schedule.getRemindersEnabled());
        assertNull(schedule.getReminderDelay());
        assertNull(schedule.getReminderInterval());
        assertNull(schedule.getMaxReminders());
        assertNull(schedule.getExpirationEnabled());
        assertNull(schedule.getExpireAfter());
        assertNull(schedule.getExpirationWarning());
        assertNull(schedule.getExpirationWarningInterval());
    }

    // The reason the fields are boxed: a deliberate "off" must survive as false, not vanish.
    @Test
    @DisplayName("keeps an explicit false distinct from unset")
    void keepsExplicitFalseDistinctFromUnset() {
        SignatureSchedule off = SignatureSchedule.builder()
                .remindersEnabled(false)
                .expirationEnabled(false)
                .build();

        assertFalse(off.getRemindersEnabled());
        assertFalse(off.getExpirationEnabled());
        assertNull(SignatureSchedule.builder().build().getRemindersEnabled());
    }

    @Test
    @DisplayName("keeps a cap of 0 (none) and -1 (unlimited) distinct from unset")
    void keepsZeroAndUnlimitedCapsDistinctFromUnset() {
        assertEquals(0, SignatureSchedule.builder().maxReminders(0).build().getMaxReminders());
        assertEquals(-1, SignatureSchedule.builder().maxReminders(-1).build().getMaxReminders());
        assertNull(SignatureSchedule.builder().build().getMaxReminders());
    }

    // Zero is legal for the warning offset alone, and means "never warn".
    @Test
    @DisplayName("allows a zero expiration warning, meaning no warning emails")
    void allowsZeroExpirationWarning() {
        SignatureSchedule schedule = SignatureSchedule.builder()
                .expirationWarning(new SignatureSchedule.Duration(0, "hours"))
                .build();

        assertEquals(0, schedule.getExpirationWarning().getValue());
        assertEquals("hours", schedule.getExpirationWarning().getUnit());
    }

    @Test
    @DisplayName("attaches the schedule to a send request, and leaves it null when unset")
    void attachesScheduleToRequest() {
        SignatureSchedule schedule = SignatureSchedule.builder().remindersEnabled(true).build();

        SendSignatureRequest withSchedule = new SendSignatureRequest.Builder()
                .deliverableId("deliv-1")
                .schedule(schedule)
                .build();
        assertTrue(withSchedule.getSchedule().getRemindersEnabled());

        SendSignatureRequest withoutSchedule = new SendSignatureRequest.Builder()
                .deliverableId("deliv-1")
                .build();
        assertNull(withoutSchedule.getSchedule(), "an unset schedule must stay null so org defaults apply");
    }
}
