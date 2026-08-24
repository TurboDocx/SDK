<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Types\Requests\Quote\SendQuoteRequest;
use TurboDocx\Types\Requests\Quote\SendQuoteWithDeliverableRequest;

/**
 * TurboQuote reminder + expiration schedule serialization tests.
 *
 * Mirrors the js-sdk, py-sdk, go-sdk, java-sdk and ruby-sdk turboquote-schedule suites, per the
 * cross-SDK test-parity rule.
 *
 * These exercise the REAL request serializer (`toArray()`) — the exact array the SDK hands to
 * `$client->post()` as the JSON body — rather than re-implementing its logic.
 *
 * The quote send endpoints are JSON (unlike the multipart signature send), so the eight schedule
 * fields ride FLAT at the top level of the body — NOT nested under a "schedule" key — and
 * durations stay as {value, unit} ARRAYS that json_encode to OBJECTS, not JSON-encoded strings.
 * Presence is null-checked, never truthiness: false (feature off) and 0 (no reminders / never
 * warn) are meaningful and must survive. Request-body keys stay camelCase.
 */
final class TurboQuoteScheduleTest extends TestCase
{
    private const SCHEDULE_KEYS = [
        'remindersEnabled',
        'reminderDelay',
        'reminderInterval',
        'maxReminders',
        'expirationEnabled',
        'expireAfter',
        'expirationWarning',
        'expirationWarningInterval',
    ];

    public function testSendQuoteSerializesEveryScheduleFieldFlatWithObjectDurations(): void
    {
        $data = (new SendQuoteRequest(
            ccEmails: ['admin@example.com'],
            remindersEnabled: true,
            reminderDelay: ['value' => 3, 'unit' => 'days'],
            reminderInterval: ['value' => 12, 'unit' => 'hours'],
            maxReminders: 5,
            expirationEnabled: true,
            expireAfter: ['value' => 30, 'unit' => 'days'],
            expirationWarning: ['value' => 3, 'unit' => 'days'],
            expirationWarningInterval: ['value' => 1, 'unit' => 'days'],
        ))->toArray();

        // Flat at the top level, never nested under "schedule".
        $this->assertArrayNotHasKey('schedule', $data);

        // Native bool / int — not stringified.
        $this->assertTrue($data['remindersEnabled']);
        $this->assertTrue($data['expirationEnabled']);
        $this->assertSame(5, $data['maxReminders']);

        // Durations stay as arrays (which encode to JSON objects), never JSON-string blobs.
        $this->assertIsArray($data['reminderDelay']);
        $this->assertSame(['value' => 3, 'unit' => 'days'], $data['reminderDelay']);
        $this->assertSame(['value' => 12, 'unit' => 'hours'], $data['reminderInterval']);
        $this->assertSame(['value' => 30, 'unit' => 'days'], $data['expireAfter']);
        $this->assertSame(['value' => 3, 'unit' => 'days'], $data['expirationWarning']);
        $this->assertSame(['value' => 1, 'unit' => 'days'], $data['expirationWarningInterval']);

        // On the wire the duration is a JSON object, not a quoted string.
        $json = json_encode($data, JSON_THROW_ON_ERROR);
        $this->assertStringContainsString('"reminderDelay":{"value":3,"unit":"days"}', $json);
        $this->assertStringNotContainsString('"reminderDelay":"', $json);

        $this->assertSame(['admin@example.com'], $data['ccEmails']);
    }

    public function testSendQuoteOmitsEveryScheduleKeyWhenUnset(): void
    {
        $data = (new SendQuoteRequest(ccEmails: ['admin@example.com']))->toArray();

        foreach (self::SCHEDULE_KEYS as $key) {
            $this->assertArrayNotHasKey($key, $data, "$key should be omitted so the org default applies");
        }
    }

    /**
     * false and 0 are meaningful, not "unset" — a truthiness check would drop them and silently
     * fall back to the org default, the opposite of what the caller asked for.
     */
    public function testSendQuotePreservesMeaningfulZeros(): void
    {
        $data = (new SendQuoteRequest(
            maxReminders: 0,
            expirationEnabled: false,
        ))->toArray();

        $this->assertSame(0, $data['maxReminders']);
        $this->assertFalse($data['expirationEnabled']);
    }

    public function testSendQuoteWithDeliverableCarriesScheduleFlat(): void
    {
        $data = (new SendQuoteWithDeliverableRequest(
            deliverableId: 'del-1',
            mergePosition: 'end',
            remindersEnabled: true,
            reminderDelay: ['value' => 2, 'unit' => 'days'],
            expirationEnabled: false,
        ))->toArray();

        $this->assertArrayNotHasKey('schedule', $data);
        $this->assertSame('del-1', $data['deliverableId']);
        $this->assertTrue($data['remindersEnabled']);
        $this->assertSame(['value' => 2, 'unit' => 'days'], $data['reminderDelay']);
        $this->assertFalse($data['expirationEnabled']);
    }
}
