<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use TurboDocx\TurboSign;
use TurboDocx\Types\Field;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Requests\CreateEmbeddedSignatureRequest;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;
use TurboDocx\Types\Requests\EmbeddedRecipientFields;
use TurboDocx\Types\Requests\EmbeddedSignatureRecipient;
use TurboDocx\Types\Requests\SendSignatureRequest;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;

/**
 * With fitAnchoredTags left false, every request is exactly what it was before the parameter
 * existed: the same method, path and body, key for key and in the same order, on both send paths
 * (multipart and JSON, compared byte for byte) and on createEmbeddedSignature, whose fields
 * shorthand keeps its default size. These expectations pass unchanged against the code from
 * before the parameter was added.
 */
final class TurboSignFitAnchoredTagsOffTest extends TestCase
{
    use EmbeddedSigningTestSupport;

    protected function tearDown(): void
    {
        $this->resetTurboSignClient();
    }

    private function sentResponse(): Response
    {
        return new Response(200, [], (string) json_encode(['data' => [
            'success' => true,
            'documentId' => 'doc-1',
            'status' => 'under_review',
            'recipients' => [['id' => 'rec-1', 'name' => 'Jane Doe', 'email' => 'jane@example.com']],
            'message' => 'ok',
        ]]));
    }

    /**
     * The request's form as ordered [name, value] pairs, the file part by its file name.
     *
     * @return array<int, array{string, string}>
     */
    private function multipartParts(string $body): array
    {
        preg_match_all('/name="([^"]+)"(?:; filename="([^"]*)")?.*?\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches, PREG_SET_ORDER);
        $parts = [];
        foreach ($matches as [, $name, $fileName, $value]) {
            $parts[] = [$name, $name === 'file' ? $fileName : $value];
        }
        return $parts;
    }

    /**
     * @return array<string, array{string, bool}>
     */
    public static function sends(): array
    {
        return [
            'sendSignature, upload (multipart)' => ['sendSignature', true],
            'sendSignature, file link (JSON)' => ['sendSignature', false],
            'createSignatureReviewLink, upload (multipart)' => ['createSignatureReviewLink', true],
            'createSignatureReviewLink, file link (JSON)' => ['createSignatureReviewLink', false],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('sends')]
    public function testTheRequestIsUnchanged(string $method, bool $upload): void
    {
        $this->injectTurboSignClient([$this->sentResponse()], captureHistory: true);

        $recipients = [new Recipient('Jane Doe', 'jane@example.com', 1)];
        $fields = [new Field(
            SignatureFieldType::SIGNATURE,
            'jane@example.com',
            template: new TemplateConfig(anchor: '{ClientSign}'),
        )];
        // Every other option, so the order of all the keys around the flag is pinned too.
        $options = [
            'recipients' => $recipients,
            'fields' => $fields,
            'file' => $upload ? '%PDF-1.4 fake pdf bytes' : null,
            'fileLink' => $upload ? null : 'https://example.com/c.pdf',
            'documentName' => 'Contract',
            'documentDescription' => 'Please sign',
            'senderName' => 'Acme',
            'senderEmail' => 'sender@company.com',
            'ccEmails' => ['cc@example.com'],
            'remindersEnabled' => true,
            'reminderDelay' => ['value' => 2, 'unit' => 'days'],
        ];
        if ($method === 'sendSignature') {
            TurboSign::sendSignature(new SendSignatureRequest(...[...$options, 'sendEmail' => false]));
            $path = '/turbosign/single/prepare-for-signing';
        } else {
            TurboSign::createSignatureReviewLink(new CreateSignatureReviewLinkRequest(...$options));
            $path = '/turbosign/single/prepare-for-review';
        }

        $this->assertCount(1, $this->requestHistory);
        $request = $this->requestHistory[0]['request'];
        $this->assertSame('POST', $request->getMethod());
        $this->assertSame($path, $request->getUri()->getPath());

        $expected = [
            ['recipients', '[{"name":"Jane Doe","email":"jane@example.com","signingOrder":1}]'],
            ['fields', '[{"type":"signature","recipientEmail":"jane@example.com","template":{"anchor":"{ClientSign}"}}]'],
            ['documentName', 'Contract'],
            ['documentDescription', 'Please sign'],
            ['senderEmail', 'sender@company.com'],
            ['senderName', 'Acme'],
            ['ccEmails', '["cc@example.com"]'],
        ];
        // sendEmail is a send option: the review link has never had it.
        if ($method === 'sendSignature') {
            $expected[] = ['sendEmail', false];
        }
        $expected[] = ['remindersEnabled', true];
        $expected[] = ['reminderDelay', '{"value":2,"unit":"days"}'];

        if ($upload) {
            $asText = array_map(
                fn(array $p) => [$p[0], is_bool($p[1]) ? ($p[1] ? 'true' : 'false') : $p[1]],
                $expected
            );
            $this->assertSame(
                array_merge([['file', 'document.pdf']], $asText),
                $this->multipartParts((string) $request->getBody())
            );
        } else {
            $expected[] = ['fileLink', 'https://example.com/c.pdf'];
            $this->assertSame(
                json_encode(array_column($expected, 1, 0)),
                (string) $request->getBody()
            );
        }
    }

    public function testCreateEmbeddedSignatureSendsTheSameBodyWithTheShorthandSize(): void
    {
        $this->injectTurboSignClient([
            $this->sentResponse(),
            new Response(200, [], (string) json_encode(['data' => ['results' => [
                'url' => 'https://app/sign/doc-1?token=T',
                'expiresAt' => null,
                'recipientId' => 'rec-1',
                'identityVerificationMode' => null,
                'pendingChecks' => [],
            ]]])),
        ], captureHistory: true);

        TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
            recipients: [new EmbeddedSignatureRecipient(
                name: 'Jane Doe',
                email: 'jane@example.com',
                fields: new EmbeddedRecipientFields(signature: '{ClientSign}', date: '{Date}'),
            )],
            fileLink: 'https://example.com/c.pdf',
            senderEmail: 'sender@company.com',
        ));

        $request = $this->requestHistory[0]['request'];
        $this->assertSame('/turbosign/single/prepare-for-signing', $request->getUri()->getPath());
        $this->assertSame(
            json_encode([
                'recipients' => '[{"name":"Jane Doe","email":"jane@example.com","signingOrder":1}]',
                'fields' => '[{"type":"signature","recipientEmail":"jane@example.com",'
                    . '"template":{"anchor":"{ClientSign}","placement":"replace","size":{"width":100,"height":30}}},'
                    . '{"type":"date","recipientEmail":"jane@example.com",'
                    . '"template":{"anchor":"{Date}","placement":"replace","size":{"width":75,"height":30}}}]',
                'senderEmail' => 'sender@company.com',
                'sendEmail' => false,
                'fileLink' => 'https://example.com/c.pdf',
            ]),
            (string) $request->getBody()
        );
    }
}
