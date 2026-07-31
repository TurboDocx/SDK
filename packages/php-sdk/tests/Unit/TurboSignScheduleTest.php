<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\TurboSign;
use TurboDocx\Types\Requests\SendSignatureRequest;
use ReflectionMethod;

/**
 * TurboSign reminder + expiration schedule tests.
 *
 * Mirrors the js-sdk, py-sdk, go-sdk and ruby-sdk suites case-for-case, per the cross-SDK
 * test-parity rule.
 *
 * These invoke the REAL private helper through reflection rather than re-implementing its logic,
 * so a change to the shipped serializer breaks the test.
 *
 * Durations are JSON-encoded on both send paths: multipart/form-data cannot carry a nested value,
 * and the API decodes a JSON-string duration on either content type, so one code path serves both.
 * Request-body keys stay camelCase — the API is not snake_case-aware.
 */
final class TurboSignScheduleTest extends TestCase
{
    /**
     * @param array<string, mixed> $scheduleArgs
     * @return array<string, mixed>
     */
    private function applyOverrides(array $scheduleArgs): array
    {
        // Named-argument spread must come as one array — PHP forbids unpacking AFTER named args.
        $request = new SendSignatureRequest(...array_merge(
            ['recipients' => [], 'fields' => [], 'deliverableId' => 'deliv-1'],
            $scheduleArgs
        ));

        $formData = [];
        $method = new ReflectionMethod(TurboSign::class, 'applyScheduleOverrides');
        $method->invokeArgs(null, [&$formData, $request]);

        return $formData;
    }

    public function testSendsEveryScheduleField(): void
    {
        $formData = $this->applyOverrides([
            'remindersEnabled' => true,
            'reminderDelay' => ['value' => 3, 'unit' => 'days'],
            'reminderInterval' => ['value' => 12, 'unit' => 'hours'],
            'maxReminders' => 5,
            'expirationEnabled' => true,
            'expireAfter' => ['value' => 30, 'unit' => 'days'],
            'expirationWarning' => ['value' => 3, 'unit' => 'days'],
            'expirationWarningInterval' => ['value' => 1, 'unit' => 'days'],
        ]);

        $this->assertTrue($formData['remindersEnabled']);
        $this->assertSame(5, $formData['maxReminders']);
        $this->assertTrue($formData['expirationEnabled']);
        $this->assertSame(['value' => 3, 'unit' => 'days'], json_decode($formData['reminderDelay'], true));
        $this->assertSame(['value' => 12, 'unit' => 'hours'], json_decode($formData['reminderInterval'], true));
        $this->assertSame(['value' => 30, 'unit' => 'days'], json_decode($formData['expireAfter'], true));
        $this->assertSame(['value' => 3, 'unit' => 'days'], json_decode($formData['expirationWarning'], true));
        $this->assertSame(['value' => 1, 'unit' => 'days'], json_decode($formData['expirationWarningInterval'], true));
    }

    public function testOmitsEveryScheduleKeyWhenUnset(): void
    {
        $formData = $this->applyOverrides([]);

        foreach ([
            'remindersEnabled',
            'reminderDelay',
            'reminderInterval',
            'maxReminders',
            'expirationEnabled',
            'expireAfter',
            'expirationWarning',
            'expirationWarningInterval',
        ] as $key) {
            $this->assertArrayNotHasKey($key, $formData, "$key should be omitted so the org default applies");
        }
    }

    /**
     * `false` and `0` are meaningful values, not "unset" — a truthiness check would drop them and
     * silently fall back to the org default, the opposite of what the caller asked for.
     */
    public function testSendsExplicitFalseRatherThanDroppingIt(): void
    {
        $formData = $this->applyOverrides([
            'remindersEnabled' => false,
            'expirationEnabled' => false,
        ]);

        $this->assertFalse($formData['remindersEnabled']);
        $this->assertFalse($formData['expirationEnabled']);
    }

    public function testSendsZeroAndUnlimitedMaxReminders(): void
    {
        $this->assertSame(0, $this->applyOverrides(['maxReminders' => 0])['maxReminders']);
        $this->assertSame(-1, $this->applyOverrides(['maxReminders' => -1])['maxReminders']);
    }

    /** Zero is legal for the warning offset alone, and means "never warn". */
    public function testSendsZeroExpirationWarning(): void
    {
        $formData = $this->applyOverrides([
            'expirationWarning' => ['value' => 0, 'unit' => 'hours'],
        ]);

        $this->assertSame(['value' => 0, 'unit' => 'hours'], json_decode($formData['expirationWarning'], true));
    }

    public function testSendReminderIsPubliclyExposed(): void
    {
        $this->assertTrue(
            method_exists(TurboSign::class, 'sendReminder'),
            'TurboSign::sendReminder must exist for cross-SDK parity'
        );

        $method = new ReflectionMethod(TurboSign::class, 'sendReminder');
        $this->assertTrue($method->isPublic());
        $this->assertTrue($method->isStatic());

        $params = $method->getParameters();
        $this->assertSame('documentId', $params[0]->getName());
        // recipientIds is optional — omitting it reminds every eligible signer.
        $this->assertSame('recipientIds', $params[1]->getName());
        $this->assertTrue($params[1]->isOptional());
    }
}
