<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\TurboSign;
use TurboDocx\Types\Requests\CreateEmbeddedSignatureRequest;
use TurboDocx\Types\Requests\EmbeddedRecipientAuth;
use TurboDocx\Types\Requests\EmbeddedRecipientFields;
use TurboDocx\Types\Requests\EmbeddedSignatureRecipient;

/**
 * Tests for TurboSign::createEmbeddedSignature — the one-call create + per-recipient embed URL
 * wrapper over sendSignature + createSigningUrl.
 *
 * Mirrors the js-sdk suite: status mapping by error CODE (ready / pending / completed), rethrow of
 * genuine errors, the recipient-not-returned guard, signing-order assembly, and the two wrapper
 * invariants (sendEmail defaults to false; the ergonomic auth shorthand becomes a full
 * identityVerification on the outgoing sendSignature body).
 */
final class CreateEmbeddedSignatureTest extends TestCase
{
    use EmbeddedSigningTestSupport;

    protected function tearDown(): void
    {
        $this->resetTurboSignClient();
    }

    /**
     * Canned sendSignature response body (the { data: {...} } envelope the HTTP client unwraps).
     *
     * @param array<array{id: string, email: string, name: string}> $recipients
     */
    private function sendSignatureResponse(string $documentId, array $recipients): Response
    {
        return new Response(200, [], (string) json_encode([
            'data' => [
                'success' => true,
                'documentId' => $documentId,
                'status' => 'under_review',
                'recipients' => $recipients,
                'message' => 'ok',
            ],
        ]));
    }

    /**
     * Canned createSigningUrl success body ({ data: { results } }).
     */
    private function signingUrlResponse(string $url, string $recipientId, string $mode = 'otp'): Response
    {
        return new Response(200, [], (string) json_encode([
            'data' => ['results' => [
                'url' => $url,
                'expiresAt' => null,
                'recipientId' => $recipientId,
                'identityVerificationMode' => $mode,
                'pendingChecks' => $mode === 'otp' ? ['email_otp'] : [],
            ]],
        ]));
    }

    public function testReadyRecipientCarriesEmbedUrlAndForwardsWrapperInvariants(): void
    {
        // Arrange: one signer whose turn it is. Two queued responses: sendSignature, then the URL.
        $this->injectTurboSignClient([
            $this->sendSignatureResponse('doc-1', [
                ['id' => 'r1', 'email' => 'john@example.com', 'name' => 'John Doe'],
            ]),
            $this->signingUrlResponse('https://sign.turbodocx.com/embed/r1', 'r1'),
        ], captureHistory: true);

        // Act
        $response = TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
            recipients: [
                new EmbeddedSignatureRecipient(
                    name: 'John Doe',
                    email: 'john@example.com',
                    auth: new EmbeddedRecipientAuth(emailOtp: true),
                    fields: new EmbeddedRecipientFields(signature: '{signature1}', date: '{date1}'),
                ),
            ],
            deliverableId: 'deliv-1',
        ));

        // Assert: the result carries the embed URL + resolved mode, status 'ready'.
        $this->assertSame('doc-1', $response->documentId);
        $this->assertCount(1, $response->recipients);
        $result = $response->recipients[0];
        $this->assertSame('ready', $result->status);
        $this->assertSame('https://sign.turbodocx.com/embed/r1', $result->embedUrl);
        $this->assertSame('r1', $result->recipientId);
        $this->assertSame('john@example.com', $result->email);
        $this->assertSame('otp', $result->identityVerificationMode);

        // Assert wrapper invariant #1: sendEmail defaulted to false and was forwarded (not dropped).
        $sendBody = $this->capturedJsonBody(0);
        $this->assertArrayHasKey('sendEmail', $sendBody);
        $this->assertFalse($sendBody['sendEmail']);

        // Assert wrapper invariant #2: the auth shorthand became a full identityVerification, and
        // the fields shorthand expanded into anchored template fields.
        $recipients = json_decode($sendBody['recipients'], true);
        $this->assertSame('otp', $recipients[0]['identityVerification']['mode']);
        $this->assertSame('email', $recipients[0]['identityVerification']['channel']);
        $this->assertSame(1, $recipients[0]['signingOrder']);

        $fields = json_decode($sendBody['fields'], true);
        $this->assertCount(2, $fields);
        $this->assertSame('signature', $fields[0]['type']);
        $this->assertSame('{signature1}', $fields[0]['template']['anchor']);
        $this->assertSame('replace', $fields[0]['template']['placement']);
    }

    public function testNotSignersTurnDegradesToPendingWithNullUrl(): void
    {
        // Arrange: the backend refuses to mint a URL for a signer whose turn hasn't come.
        $this->injectTurboSignClient([
            $this->sendSignatureResponse('doc-1', [
                ['id' => 'r2', 'email' => 'jane@example.com', 'name' => 'Jane Smith'],
            ]),
            new Response(400, [], (string) json_encode(['message' => 'not your turn', 'code' => 'NotSignersTurn'])),
        ]);

        // Act
        $response = TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
            recipients: [
                new EmbeddedSignatureRecipient(
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    auth: new EmbeddedRecipientAuth(emailOtp: true),
                ),
            ],
            deliverableId: 'deliv-1',
        ));

        // Assert: pending, no URL, mode derived from the request shorthand (not the failed server call).
        $result = $response->recipients[0];
        $this->assertSame('pending', $result->status);
        $this->assertNull($result->embedUrl);
        $this->assertSame('otp', $result->identityVerificationMode);
    }

    public function testAlreadySignedDegradesToCompletedRegardlessOfHttpStatus(): void
    {
        // Arrange: RecipientAlreadySigned arrives as a 409 (Conflict). The catch must be
        // status-agnostic — branching on errorCode under the BASE exception, not on the HTTP class.
        $this->injectTurboSignClient([
            $this->sendSignatureResponse('doc-1', [
                ['id' => 'r3', 'email' => 'sam@example.com', 'name' => 'Sam'],
            ]),
            new Response(409, [], (string) json_encode(['message' => 'already signed', 'code' => 'RecipientAlreadySigned'])),
        ]);

        // Act
        $response = TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
            recipients: [new EmbeddedSignatureRecipient(name: 'Sam', email: 'sam@example.com')],
            deliverableId: 'deliv-1',
        ));

        // Assert
        $result = $response->recipients[0];
        $this->assertSame('completed', $result->status);
        $this->assertNull($result->embedUrl);
    }

    public function testGenuineErrorPropagates(): void
    {
        // Arrange: any code other than the two expected turn states is a real failure and rethrows.
        $this->injectTurboSignClient([
            $this->sendSignatureResponse('doc-1', [
                ['id' => 'r4', 'email' => 'kim@example.com', 'name' => 'Kim'],
            ]),
            new Response(400, [], (string) json_encode(['message' => 'boom', 'code' => 'SomethingElse'])),
        ]);

        // Act & Assert
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('boom');
        TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
            recipients: [new EmbeddedSignatureRecipient(name: 'Kim', email: 'kim@example.com')],
            deliverableId: 'deliv-1',
        ));
    }

    public function testThrowsWhenSendSignatureDoesNotReturnRecipient(): void
    {
        // Arrange: the send response carries no matching recipient — cannot mint a URL.
        $this->injectTurboSignClient([
            $this->sendSignatureResponse('doc-1', []),
        ]);

        // Act & Assert
        try {
            TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
                recipients: [new EmbeddedSignatureRecipient(name: 'Lee', email: 'lee@example.com')],
                deliverableId: 'deliv-1',
            ));
            $this->fail('Expected ValidationException');
        } catch (ValidationException $e) {
            $this->assertSame('EmbeddedRecipientNotReturned', $e->errorCode);
        }
    }

    public function testAssemblesResultsInSigningOrder(): void
    {
        // Arrange: two recipients supplied OUT of signing order (Bob=2 before Ann=1). The result
        // must come back sorted by signingOrder, so the first URL is minted for Ann.
        $this->injectTurboSignClient([
            $this->sendSignatureResponse('doc-1', [
                ['id' => 'r-bob', 'email' => 'bob@example.com', 'name' => 'Bob'],
                ['id' => 'r-ann', 'email' => 'ann@example.com', 'name' => 'Ann'],
            ]),
            // Consumed in processing order: Ann (order 1) first, then Bob (order 2).
            $this->signingUrlResponse('https://sign.turbodocx.com/embed/ann', 'r-ann', 'none'),
            $this->signingUrlResponse('https://sign.turbodocx.com/embed/bob', 'r-bob', 'none'),
        ]);

        // Act
        $response = TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
            recipients: [
                new EmbeddedSignatureRecipient(name: 'Bob', email: 'bob@example.com', signingOrder: 2),
                new EmbeddedSignatureRecipient(name: 'Ann', email: 'ann@example.com', signingOrder: 1),
            ],
            deliverableId: 'deliv-1',
        ));

        // Assert: results are ordered Ann (1) then Bob (2), each with its own URL.
        $this->assertCount(2, $response->recipients);
        $this->assertSame('ann@example.com', $response->recipients[0]->email);
        $this->assertSame('https://sign.turbodocx.com/embed/ann', $response->recipients[0]->embedUrl);
        $this->assertSame('bob@example.com', $response->recipients[1]->email);
        $this->assertSame('https://sign.turbodocx.com/embed/bob', $response->recipients[1]->embedUrl);
    }
}
