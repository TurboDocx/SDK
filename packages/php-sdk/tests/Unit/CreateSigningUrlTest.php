<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\TurboSign;
use TurboDocx\Types\IdentityAssertion;
use TurboDocx\Types\Requests\CreateSigningUrlRequest;

/**
 * Tests for TurboSign::createSigningUrl — the single-use embedded signing URL minter.
 *
 * Mirrors the js-sdk suite: XOR selector validation, https-only returnUrl, and the double-envelope
 * unwrap ({ data: { results } } -> results). XOR/returnUrl checks run before the HTTP client is
 * touched, so those cases need no mock transport.
 */
final class CreateSigningUrlTest extends TestCase
{
    use EmbeddedSigningTestSupport;

    protected function tearDown(): void
    {
        $this->resetTurboSignClient();
    }

    // ---- XOR selector validation (HTTP-free) -----------------------------------------------

    public function testThrowsWhenBothSelectorsProvided(): void
    {
        // Arrange: both recipientId and externalId set — ambiguous.
        $request = new CreateSigningUrlRequest(recipientId: 'r1', externalId: 'ext1');

        // Act & Assert: the SDK rejects it with the actionable code before any request goes out.
        try {
            TurboSign::createSigningUrl('doc-1', $request);
            $this->fail('Expected ValidationException');
        } catch (ValidationException $e) {
            $this->assertSame('RecipientSelectorInvalid', $e->errorCode);
        }
    }

    public function testThrowsWhenNeitherSelectorProvided(): void
    {
        // Arrange: neither selector set.
        $request = new CreateSigningUrlRequest();

        // Act & Assert
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('exactly one of recipientId or externalId');
        TurboSign::createSigningUrl('doc-1', $request);
    }

    public function testTreatsEmptyStringSelectorAsAbsent(): void
    {
        // Arrange: recipientId is an empty string — the XOR count must treat it as not provided,
        // so this is "neither selector" and must fail rather than pass an empty id to the server.
        $request = new CreateSigningUrlRequest(recipientId: '');

        // Act & Assert
        $this->expectException(ValidationException::class);
        TurboSign::createSigningUrl('doc-1', $request);
    }

    public function testThrowsWhenReturnUrlIsNotHttps(): void
    {
        // Arrange: valid selector but an http returnUrl.
        $request = new CreateSigningUrlRequest(recipientId: 'r1', returnUrl: 'http://insecure.example.com/done');

        // Act & Assert
        try {
            TurboSign::createSigningUrl('doc-1', $request);
            $this->fail('Expected ValidationException');
        } catch (ValidationException $e) {
            $this->assertSame('InvalidReturnUrl', $e->errorCode);
        }
    }

    public function testTreatsEmptyStringReturnUrlAsAbsent(): void
    {
        // Arrange: a valid selector plus an EMPTY-string returnUrl. It must be treated as absent —
        // no InvalidReturnUrl throw (an empty string is not an http URL) — and must be OMITTED from
        // the request body, matching js-sdk (`if (request.returnUrl && ...)`), Go, and Python.
        $this->injectTurboSignClient([
            new Response(200, [], (string) json_encode([
                'data' => ['results' => [
                    'url' => 'https://sign.turbodocx.com/embed/abc',
                    'recipientId' => 'r1',
                    'pendingChecks' => [],
                ]],
            ])),
        ], captureHistory: true);

        // Act: this must NOT throw despite the empty returnUrl.
        $result = TurboSign::createSigningUrl('doc-1', new CreateSigningUrlRequest(
            recipientId: 'r1',
            returnUrl: ''
        ));

        // Assert: request succeeded and the empty returnUrl was not sent to the server.
        $this->assertSame('r1', $result->recipientId);
        $body = $this->capturedJsonBody();
        $this->assertArrayNotHasKey('returnUrl', $body);
        $this->assertSame('r1', $body['recipientId']);
    }

    // ---- Success path: double-envelope unwrap ----------------------------------------------

    public function testUnwrapsDoubleEnvelopedResults(): void
    {
        // Arrange: the endpoint replies { data: { results: {...} } }. The HTTP client strips the
        // outer `data`; createSigningUrl must strip the `results` envelope.
        $this->injectTurboSignClient([
            new Response(200, [], (string) json_encode([
                'data' => [
                    'results' => [
                        'url' => 'https://sign.turbodocx.com/embed/abc',
                        'expiresAt' => null,
                        'recipientId' => 'r1',
                        'identityVerificationMode' => 'otp',
                        'pendingChecks' => ['email_otp'],
                    ],
                ],
            ])),
        ]);

        // Act
        $result = TurboSign::createSigningUrl('doc-1', new CreateSigningUrlRequest(recipientId: 'r1'));

        // Assert: fields come from the inner results object, not the envelope.
        $this->assertSame('https://sign.turbodocx.com/embed/abc', $result->url);
        $this->assertNull($result->expiresAt);
        $this->assertSame('r1', $result->recipientId);
        $this->assertSame('otp', $result->identityVerificationMode);
        $this->assertSame(['email_otp'], $result->pendingChecks);
    }

    public function testAcceptsArrayRequestAndSendsSelectorAndAssertion(): void
    {
        // Arrange: the array|DTO ergonomic form, with a nested identity assertion.
        $this->injectTurboSignClient([
            new Response(200, [], (string) json_encode([
                'data' => ['results' => [
                    'url' => 'https://sign.turbodocx.com/embed/xyz',
                    'expiresAt' => '2026-01-01T00:00:00.000Z',
                    'recipientId' => 'r9',
                    'externalId' => 'ext-9',
                    'identityVerificationMode' => 'external_idv',
                    'pendingChecks' => [],
                ]],
            ])),
        ], captureHistory: true);

        // Act: pass a plain array; createSigningUrl builds the DTO and forwards the body.
        $result = TurboSign::createSigningUrl('doc-1', [
            'externalId' => 'ext-9',
            'identityAssertion' => [
                'provider' => 'CAPA',
                'verificationId' => 'v-1',
                'verifiedAt' => '2026-01-01T00:00:00.000Z',
                'subjectEmail' => 'john@example.com',
            ],
        ]);

        // Assert on the response...
        $this->assertSame('ext-9', $result->externalId);
        $this->assertSame('external_idv', $result->identityVerificationMode);
        $this->assertSame([], $result->pendingChecks);

        // ...and that the request body carried exactly the selector + assertion (no recipientId).
        $body = $this->capturedJsonBody();
        $this->assertSame('ext-9', $body['externalId']);
        $this->assertArrayNotHasKey('recipientId', $body);
        $this->assertSame('CAPA', $body['identityAssertion']['provider']);
        $this->assertSame('john@example.com', $body['identityAssertion']['subjectEmail']);
    }

    public function testAllowsHttpsReturnUrlCaseInsensitively(): void
    {
        // Arrange: an uppercase scheme must still pass (mirrors JS's case-insensitive regex).
        $this->injectTurboSignClient([
            new Response(200, [], (string) json_encode([
                'data' => ['results' => [
                    'url' => 'https://sign.turbodocx.com/embed/abc',
                    'recipientId' => 'r1',
                    'pendingChecks' => [],
                ]],
            ])),
        ]);

        // Act
        $result = TurboSign::createSigningUrl('doc-1', new CreateSigningUrlRequest(
            recipientId: 'r1',
            returnUrl: 'HTTPS://app.example.com/done'
        ));

        // Assert: no exception, response parsed.
        $this->assertSame('r1', $result->recipientId);
    }

    public function testIdentityAssertionToArrayShape(): void
    {
        // Directly verify the assertion DTO serialization used in the request body.
        $assertion = new IdentityAssertion('CAPA', 'v-1', '2026-01-01T00:00:00.000Z', 'john@example.com');
        $this->assertSame([
            'provider' => 'CAPA',
            'verificationId' => 'v-1',
            'verifiedAt' => '2026-01-01T00:00:00.000Z',
            'subjectEmail' => 'john@example.com',
        ], $assertion->toArray());
    }
}
