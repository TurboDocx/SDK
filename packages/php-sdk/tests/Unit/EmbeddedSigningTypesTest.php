<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\TurboSign;
use TurboDocx\Types\IdentityVerification;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Requests\CreateSigningUrlRequest;
use TurboDocx\Types\Requests\EmbeddedRecipientAuth;
use TurboDocx\Types\Requests\EmbeddedRecipientFields;
use TurboDocx\Types\Requests\EmbeddedSignatureRecipient;

/**
 * DTO + mapping tests for the embedded-signing surface.
 *
 * These invoke the REAL serialization and the REAL private mapping helpers (through reflection,
 * as TurboSignScheduleTest does) so a change to the shipped logic breaks the test rather than a
 * re-implementation of it.
 */
final class EmbeddedSigningTypesTest extends TestCase
{
    // ---- IdentityVerification value object -------------------------------------------------

    public function testOtpToArrayCarriesChannel(): void
    {
        $this->assertSame(['mode' => 'otp', 'channel' => 'email'], IdentityVerification::otp('email')->toArray());
        $this->assertSame(['mode' => 'otp', 'channel' => 'sms'], IdentityVerification::otp('sms')->toArray());
    }

    public function testExternalIdvToArrayCarriesProviderAndAge(): void
    {
        $iv = IdentityVerification::externalIdv('CAPA', 60);
        $this->assertSame(['mode' => 'external_idv', 'provider' => 'CAPA', 'maxAgeMinutes' => 60], $iv->toArray());
    }

    public function testExternalIdvRejectsEmptyProvider(): void
    {
        $this->expectException(ValidationException::class);
        IdentityVerification::externalIdv('   ');
    }

    public function testOverrideToArrayCarriesAcknowledgementAndReason(): void
    {
        $iv = IdentityVerification::override('QA smoke test');
        $this->assertSame(
            ['mode' => 'override', 'overrideIdentityVerification' => true, 'reason' => 'QA smoke test'],
            $iv->toArray()
        );
    }

    public function testOverrideRejectsEmptyReason(): void
    {
        $this->expectException(ValidationException::class);
        IdentityVerification::override('');
    }

    // ---- Recipient additive serialization --------------------------------------------------

    public function testRecipientEmitsEmbeddedFieldsOnlyWhenSet(): void
    {
        // A recipient carrying identity + phone serializes the new keys...
        $withIdentity = new Recipient(
            name: 'John',
            email: 'john@example.com',
            signingOrder: 1,
            phone: '+13055551234',
            identityVerification: IdentityVerification::otp('sms'),
        );
        $array = $withIdentity->toArray();
        $this->assertSame('+13055551234', $array['phone']);
        $this->assertSame(['mode' => 'otp', 'channel' => 'sms'], $array['identityVerification']);

        // ...while a plain recipient keeps the original three-key shape (backward compatible).
        $plain = new Recipient('Jane', 'jane@example.com', 2);
        $this->assertSame(['name' => 'Jane', 'email' => 'jane@example.com', 'signingOrder' => 2], $plain->toArray());
    }

    // ---- CreateSigningUrlRequest serialization ---------------------------------------------

    public function testCreateSigningUrlRequestOmitsUnsetKeys(): void
    {
        $this->assertSame(['recipientId' => 'r1'], (new CreateSigningUrlRequest(recipientId: 'r1'))->toArray());
        $this->assertSame(
            ['externalId' => 'ext1', 'returnUrl' => 'https://x.example.com'],
            (new CreateSigningUrlRequest(externalId: 'ext1', returnUrl: 'https://x.example.com'))->toArray()
        );
    }

    // ---- resolveIdentityVerification (real private helper via reflection) ------------------

    public function testResolveIdentityVerificationMapping(): void
    {
        $method = new ReflectionMethod(TurboSign::class, 'resolveIdentityVerification');

        // emailOtp -> otp/email
        $emailOtp = new EmbeddedSignatureRecipient(
            name: 'A',
            email: 'a@example.com',
            auth: new EmbeddedRecipientAuth(emailOtp: true),
        );
        /** @var IdentityVerification|null $iv */
        $iv = $method->invoke(null, $emailOtp);
        $this->assertInstanceOf(IdentityVerification::class, $iv);
        $this->assertSame('otp', $iv->mode);
        $this->assertSame('email', $iv->channel);

        // sms shorthand -> otp/sms
        $sms = new EmbeddedSignatureRecipient(
            name: 'B',
            email: 'b@example.com',
            auth: new EmbeddedRecipientAuth(smsPhoneNumber: '+13055550000'),
        );
        $ivSms = $method->invoke(null, $sms);
        $this->assertSame('sms', $ivSms->channel);

        // emailOtp wins when both are set
        $both = new EmbeddedSignatureRecipient(
            name: 'C',
            email: 'c@example.com',
            auth: new EmbeddedRecipientAuth(emailOtp: true, smsPhoneNumber: '+13055550001'),
        );
        $this->assertSame('email', $method->invoke(null, $both)->channel);

        // no auth -> null (no verification)
        $none = new EmbeddedSignatureRecipient(name: 'D', email: 'd@example.com');
        $this->assertNull($method->invoke(null, $none));
    }

    // ---- expandRecipientFields (real private helper via reflection) ------------------------

    public function testExpandRecipientFieldsProducesAnchoredTemplateFields(): void
    {
        $method = new ReflectionMethod(TurboSign::class, 'expandRecipientFields');

        $recipient = new EmbeddedSignatureRecipient(
            name: 'John',
            email: 'john@example.com',
            fields: new EmbeddedRecipientFields(signature: '{sig}', initials: '{ini}'),
        );

        /** @var array<\TurboDocx\Types\Field> $fields */
        $fields = $method->invoke(null, $recipient);
        $this->assertCount(2, $fields);

        // signature: type 'signature', recipient email, replace at anchor, default 100x30
        $sig = $fields[0]->toArray();
        $this->assertSame('signature', $sig['type']);
        $this->assertSame('john@example.com', $sig['recipientEmail']);
        $this->assertSame('{sig}', $sig['template']['anchor']);
        $this->assertSame('replace', $sig['template']['placement']);
        $this->assertSame(['width' => 100, 'height' => 30], $sig['template']['size']);

        // initials maps to the 'initial' field type (there is no 'initials' literal), 50x30
        $ini = $fields[1]->toArray();
        $this->assertSame('initial', $ini['type']);
        $this->assertSame(['width' => 50, 'height' => 30], $ini['template']['size']);
    }

    public function testExpandRecipientFieldsEmptyWhenNoShorthand(): void
    {
        $method = new ReflectionMethod(TurboSign::class, 'expandRecipientFields');
        $recipient = new EmbeddedSignatureRecipient(name: 'John', email: 'john@example.com');
        $this->assertSame([], $method->invoke(null, $recipient));
    }
}
