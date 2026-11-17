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
 * fitAnchoredTags on the two send paths (and createEmbeddedSignature, which sends through
 * sendSignature). It is sent only when it is true: the API treats false the same as a missing key,
 * so false leaves it out and every existing request body stays exactly as it was. Drives the real
 * HttpClient over a mocked Guzzle transport, so the multipart and JSON bodies are the ones on the
 * wire. Mirrors the js-sdk and py-sdk suites case for case.
 */
final class TurboSignFitAnchoredTagsTest extends TestCase
{
    use EmbeddedSigningTestSupport;

    private const PATHS = [
        'sendSignature' => 'turbosign/single/prepare-for-signing',
        'createSignatureReviewLink' => 'turbosign/single/prepare-for-review',
    ];

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
     * Runs one send and returns its form values (a multipart body's named parts other than the
     * file, or a JSON body).
     *
     * @return array<string, mixed>
     */
    private function sendWith(string $method, bool $upload, bool $fit): array
    {
        $this->injectTurboSignClient([$this->sentResponse()], captureHistory: true);

        $recipients = [new Recipient('Jane Doe', 'jane@example.com', 1)];
        $fields = [new Field(
            SignatureFieldType::SIGNATURE,
            'jane@example.com',
            template: new TemplateConfig(anchor: '{ClientSign}'),
        )];
        $file = $upload ? '%PDF-1.4 fake pdf bytes' : null;
        $fileLink = $upload ? null : 'https://example.com/contract.pdf';

        if ($method === 'sendSignature') {
            TurboSign::sendSignature(new SendSignatureRequest(
                recipients: $recipients,
                fields: $fields,
                file: $file,
                fileLink: $fileLink,
                fitAnchoredTags: $fit,
            ));
        } else {
            TurboSign::createSignatureReviewLink(new CreateSignatureReviewLinkRequest(
                recipients: $recipients,
                fields: $fields,
                file: $file,
                fileLink: $fileLink,
                fitAnchoredTags: $fit,
            ));
        }

        $this->assertCount(1, $this->requestHistory);
        $request = $this->requestHistory[0]['request'];
        $this->assertStringEndsWith(self::PATHS[$method], $request->getUri()->getPath());

        if (!$upload) {
            return $this->capturedJsonBody();
        }
        $body = (string) $request->getBody();
        preg_match_all('/name="([^"]+)"(?:; filename="[^"]*")?.*?\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches, PREG_SET_ORDER);
        $form = [];
        foreach ($matches as [, $name, $value]) {
            if ($name !== 'file') {
                $form[$name] = $value;
            }
        }
        return $form;
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
    public function testSendsTheFlagWhenTrue(string $method, bool $upload): void
    {
        $form = $this->sendWith($method, $upload, true);

        // Multipart carries the string "true" (not PHP's "1"); JSON carries a boolean
        $this->assertSame($upload ? 'true' : true, $form['fitAnchoredTags'] ?? null);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('sends')]
    public function testLeavesTheKeyOutWhenFalseAndTheBodyIsOtherwiseUnchanged(string $method, bool $upload): void
    {
        $off = $this->sendWith($method, $upload, false);
        $on = $this->sendWith($method, $upload, true);

        $this->assertArrayNotHasKey('fitAnchoredTags', $off);
        unset($on['fitAnchoredTags']);
        $this->assertSame($off, $on);
    }

    public function testTheFlagIsOffByDefault(): void
    {
        $this->injectTurboSignClient([$this->sentResponse()], captureHistory: true);

        TurboSign::sendSignature(new SendSignatureRequest(
            recipients: [new Recipient('Jane Doe', 'jane@example.com', 1)],
            fields: [],
            fileLink: 'https://example.com/contract.pdf',
        ));

        $this->assertArrayNotHasKey('fitAnchoredTags', $this->capturedJsonBody());
    }

    /**
     * @return array<string, mixed>
     */
    private function embedWith(bool $fit): array
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
                fields: new EmbeddedRecipientFields(signature: '{ClientSign}'),
            )],
            fileLink: 'https://example.com/contract.pdf',
            fitAnchoredTags: $fit,
        ));

        $this->assertStringEndsWith(
            self::PATHS['sendSignature'],
            $this->requestHistory[0]['request']->getUri()->getPath()
        );
        return $this->capturedJsonBody();
    }

    public function testEmbeddedSignaturePassesTheFlagToTheSendWhenTrue(): void
    {
        $this->assertTrue($this->embedWith(true)['fitAnchoredTags'] ?? null);
    }

    public function testEmbeddedSignatureLeavesTheKeyOutWhenFalse(): void
    {
        $this->assertArrayNotHasKey('fitAnchoredTags', $this->embedWith(false));
    }
}
