<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use TurboDocx\TurboSign;
use TurboDocx\Types\Requests\CreateEmbeddedSignatureRequest;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;
use TurboDocx\Types\Requests\EmbeddedRecipientFields;
use TurboDocx\Types\Requests\EmbeddedSignatureRecipient;
use TurboDocx\Types\Requests\SendSignatureRequest;

/**
 * A `fileName` on a file upload must reach the API as the uploaded part's filename (the API
 * stores it as the document's file name); without one the upload falls back to `document.<ext>`.
 */
final class TurboSignFileNameTest extends TestCase
{
    use EmbeddedSigningTestSupport;

    private const PDF = '%PDF-1.4 fake pdf bytes';

    protected function tearDown(): void
    {
        $this->resetTurboSignClient();
    }

    private function okResponse(): Response
    {
        return new Response(200, [], (string) json_encode(['data' => [
            'success' => true,
            'documentId' => 'doc-1',
            'status' => 'under_review',
            'recipients' => [['id' => 'rec-1', 'name' => 'Jane Doe', 'email' => 'jane@example.com']],
            'message' => 'ok',
        ]]));
    }

    /** The filename on the multipart "file" part of captured request $index. */
    private function uploadedFileName(int $index = 0): ?string
    {
        $body = (string) $this->requestHistory[$index]['request']->getBody();
        if (preg_match('/name="file"; filename="([^"]*)"/', $body, $matches) === 1) {
            return $matches[1];
        }
        return null;
    }

    private function hasFormField(string $name, int $index = 0): bool
    {
        $body = (string) $this->requestHistory[$index]['request']->getBody();
        return preg_match('/name="' . preg_quote($name, '/') . '"\r?\n/', $body) === 1;
    }

    public function testSendSignatureForwardsFileName(): void
    {
        $this->injectTurboSignClient([$this->okResponse()], true);

        TurboSign::sendSignature(new SendSignatureRequest(
            recipients: [],
            fields: [],
            file: self::PDF,
            fileName: 'Lease-Agreement-2026.pdf',
        ));

        $this->assertSame('Lease-Agreement-2026.pdf', $this->uploadedFileName());
        $this->assertFalse($this->hasFormField('fileName'), 'fileName is the part filename, not a stray form field');
    }

    public function testSendSignatureWithoutFileNameFallsBackToDocumentExtension(): void
    {
        $this->injectTurboSignClient([$this->okResponse()], true);

        TurboSign::sendSignature(new SendSignatureRequest(recipients: [], fields: [], file: self::PDF));

        $this->assertSame('document.pdf', $this->uploadedFileName());
    }

    public function testCreateSignatureReviewLinkForwardsFileName(): void
    {
        $this->injectTurboSignClient([$this->okResponse()], true);

        TurboSign::createSignatureReviewLink(new CreateSignatureReviewLinkRequest(
            recipients: [],
            fields: [],
            file: self::PDF,
            fileName: 'Review-Copy.pdf',
        ));

        $this->assertSame('Review-Copy.pdf', $this->uploadedFileName());
    }

    public function testCreateEmbeddedSignatureForwardsFileName(): void
    {
        $this->injectTurboSignClient([
            $this->okResponse(),
            new Response(200, [], (string) json_encode(['data' => ['results' => [
                'url' => 'https://app.example.com/e-signature/embed/doc-1?token=t',
                'expiresAt' => null,
                'recipientId' => 'rec-1',
                'identityVerificationMode' => null,
                'pendingChecks' => [],
            ]]])),
        ], true);

        TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
            recipients: [
                new EmbeddedSignatureRecipient(
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    fields: new EmbeddedRecipientFields(signature: '{signature1}'),
                ),
            ],
            file: self::PDF,
            fileName: 'Embedded-Contract.pdf',
        ));

        $this->assertSame('Embedded-Contract.pdf', $this->uploadedFileName(0));
    }
}
