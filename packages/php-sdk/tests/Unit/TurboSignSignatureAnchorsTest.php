<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use TurboDocx\Exceptions\ConflictException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\TurboSign;
use TurboDocx\Types\Field;
use TurboDocx\Types\FieldPlacement;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Requests\AddTemplateSignatureAnchorRequest;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;
use TurboDocx\Types\Requests\SendSignatureRequest;
use TurboDocx\Types\Responses\AddTemplateSignatureAnchorResponse;
use TurboDocx\Types\Responses\RemoveTemplateSignatureAnchorResponse;
use TurboDocx\Types\Responses\TemplateSignatureAnchor;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;

/**
 * Template signature setups with anchored fields: a field tied to a template tag (like
 * "{ClientSign}") for one signer role. Runs the REAL HttpClient over a Guzzle MockHandler, so the
 * requests asserted here are exactly what goes over the wire.
 */
final class TurboSignSignatureAnchorsTest extends TestCase
{
    use EmbeddedSigningTestSupport;

    private const TEMPLATE_ID = '84759112-d9d6-443a-bb78-87c427bd7948';

    private const SAVED_SETUP = [
        'roles' => [['roleId' => 'r1', 'label' => 'Signer 1', 'order' => 1]],
        'fields' => [['roleId' => 'r1', 'type' => 'signature', 'anchor' => '{ClientSign}', 'fieldId' => 'f1']],
        'savedOn' => '2026-11-06T00:00:00.000Z',
    ];

    protected function tearDown(): void
    {
        $this->resetTurboSignClient();
    }

    /**
     * @param array<string, mixed> $data
     */
    private function ok(array $data): Response
    {
        return new Response(200, ['Content-Type' => 'application/json'], (string) json_encode(['data' => $data]));
    }

    private function sent(): Response
    {
        return $this->ok(['success' => true, 'documentId' => 'doc-1', 'status' => 'under_review', 'message' => 'ok']);
    }

    /**
     * @return array<Recipient>
     */
    private function recipients(): array
    {
        return [new Recipient(name: 'Jane Doe', email: 'jane@client.com', signingOrder: 1)];
    }

    private function anchoredField(): Field
    {
        return new Field(
            SignatureFieldType::SIGNATURE,
            'jane@client.com',
            template: new TemplateConfig(anchor: '{ClientSign}'),
        );
    }

    /**
     * Extract a single form field's raw value out of a serialized multipart body.
     */
    private function multipartField(string $body, string $name): ?string
    {
        $pattern = '/name="' . preg_quote($name, '/') . '".*?\r?\n\r?\n(.*?)\r?\n--/s';
        if (preg_match($pattern, $body, $matches) === 1) {
            return $matches[1];
        }
        return null;
    }

    public function testApplySignatureSetupTrueIsSentOnSendSignatureAndReviewLink(): void
    {
        $this->injectTurboSignClient([$this->sent(), $this->sent()], captureHistory: true);

        TurboSign::sendSignature(new SendSignatureRequest(
            recipients: $this->recipients(),
            fields: [$this->anchoredField()],
            templateId: self::TEMPLATE_ID,
            applySignatureSetup: true,
        ));
        TurboSign::createSignatureReviewLink(new CreateSignatureReviewLinkRequest(
            recipients: $this->recipients(),
            fields: [$this->anchoredField()],
            templateId: self::TEMPLATE_ID,
            applySignatureSetup: true,
        ));

        $this->assertTrue($this->capturedJsonBody(0)['applySignatureSetup']);
        $this->assertTrue($this->capturedJsonBody(1)['applySignatureSetup']);
    }

    public function testApplySignatureSetupFalseIsForwardedAndNullIsOmitted(): void
    {
        $this->injectTurboSignClient([$this->sent(), $this->sent()], captureHistory: true);

        TurboSign::sendSignature(new SendSignatureRequest(
            recipients: $this->recipients(),
            fields: [$this->anchoredField()],
            templateId: self::TEMPLATE_ID,
            applySignatureSetup: false,
        ));
        TurboSign::sendSignature(new SendSignatureRequest(
            recipients: $this->recipients(),
            fields: [$this->anchoredField()],
            templateId: self::TEMPLATE_ID,
        ));

        $this->assertFalse($this->capturedJsonBody(0)['applySignatureSetup']);
        $this->assertArrayNotHasKey('applySignatureSetup', $this->capturedJsonBody(1));
    }

    public function testApplySignatureSetupIsAFormFieldOnAFileUpload(): void
    {
        $this->injectTurboSignClient([$this->sent()], captureHistory: true);

        TurboSign::sendSignature(new SendSignatureRequest(
            recipients: $this->recipients(),
            fields: [$this->anchoredField()],
            file: '%PDF-1.4',
            applySignatureSetup: true,
        ));

        $body = (string) $this->requestHistory[0]['request']->getBody();
        $this->assertSame('true', $this->multipartField($body, 'applySignatureSetup'));
    }

    public function testGetTemplateSignatureSetupMapsAnchorsAndAnchoredFieldCount(): void
    {
        $this->injectTurboSignClient([
            $this->ok([
                'templateId' => self::TEMPLATE_ID,
                'roles' => [[
                    'key' => 'signer_1',
                    'label' => 'Signer 1',
                    'order' => 1,
                    'hasSavedSigner' => false,
                    'fieldCount' => 1,
                    'anchoredFieldCount' => 1,
                ]],
                'anchors' => [
                    [
                        'fieldId' => 'f1',
                        'roleKey' => 'signer_1',
                        'type' => 'signature',
                        'anchor' => '{ClientSign}',
                        'placement' => 'replace',
                        'offset' => ['x' => 0, 'y' => 5],
                        'size' => ['width' => 120, 'height' => 30],
                        'notFound' => false,
                    ],
                    [
                        'roleKey' => 'signer_1',
                        'type' => 'date',
                        'anchor' => '{SignDate}',
                        'placement' => 'after',
                        'notFound' => true,
                    ],
                ],
            ]),
        ]);

        $setup = TurboSign::getTemplateSignatureSetup(self::TEMPLATE_ID);

        $this->assertSame(1, $setup->roles[0]->anchoredFieldCount);
        $this->assertCount(2, $setup->anchors);
        $this->assertContainsOnlyInstancesOf(TemplateSignatureAnchor::class, $setup->anchors);

        $first = $setup->anchors[0];
        $this->assertSame('f1', $first->fieldId);
        $this->assertSame('signer_1', $first->roleKey);
        $this->assertSame('signature', $first->type);
        $this->assertSame('{ClientSign}', $first->anchor);
        $this->assertSame('replace', $first->placement);
        $this->assertSame(['x' => 0, 'y' => 5], $first->offset);
        $this->assertSame(['width' => 120, 'height' => 30], $first->size);
        $this->assertFalse($first->notFound);

        $second = $setup->anchors[1];
        $this->assertNull($second->fieldId);
        $this->assertNull($second->offset);
        $this->assertNull($second->size);
        $this->assertTrue($second->notFound);
    }

    public function testGetTemplateSignatureSetupWithoutAnchorsDefaultsToEmpty(): void
    {
        $this->injectTurboSignClient([
            $this->ok([
                'templateId' => self::TEMPLATE_ID,
                'roles' => [['key' => 'client', 'label' => 'Client', 'order' => 1, 'hasSavedSigner' => false, 'fieldCount' => 2]],
            ]),
        ]);

        $setup = TurboSign::getTemplateSignatureSetup(self::TEMPLATE_ID);

        $this->assertSame([], $setup->anchors);
        $this->assertSame(0, $setup->roles[0]->anchoredFieldCount);
    }

    public function testAddTemplateSignatureAnchorPostsTheFieldWithoutTemplateIdAndUnwrapsResults(): void
    {
        $this->injectTurboSignClient([
            $this->ok(['results' => [
                'fieldId' => 'f1',
                'signatureSetup' => self::SAVED_SETUP,
                'tagBecameSignatureField' => true,
            ]]),
        ], captureHistory: true);

        $result = TurboSign::addTemplateSignatureAnchor(new AddTemplateSignatureAnchorRequest(
            templateId: self::TEMPLATE_ID,
            roleKey: 'signer_1',
            type: SignatureFieldType::SIGNATURE,
            anchor: '{ClientSign}',
            size: ['width' => 120, 'height' => 30],
            offset: ['x' => 0, 'y' => 5],
            placement: FieldPlacement::REPLACE,
        ));

        $request = $this->requestHistory[0]['request'];
        $this->assertSame('POST', $request->getMethod());
        $this->assertStringContainsString(
            '/turbosign/templates/' . self::TEMPLATE_ID . '/signature-setup/anchors',
            (string) $request->getUri()
        );
        $this->assertEquals([
            'roleKey' => 'signer_1',
            'type' => 'signature',
            'anchor' => '{ClientSign}',
            'size' => ['width' => 120, 'height' => 30],
            'offset' => ['x' => 0, 'y' => 5],
            'placement' => 'replace',
        ], $this->capturedJsonBody(0));

        $this->assertInstanceOf(AddTemplateSignatureAnchorResponse::class, $result);
        $this->assertSame('f1', $result->fieldId);
        $this->assertSame(self::SAVED_SETUP, $result->signatureSetup);
        $this->assertTrue($result->tagBecameSignatureField);
    }

    public function testAddTemplateSignatureAnchorForwardsDefaultValueAndExplicitReadonlyFalse(): void
    {
        $this->injectTurboSignClient([
            $this->ok(['results' => ['fieldId' => 'f2', 'signatureSetup' => self::SAVED_SETUP, 'tagBecameSignatureField' => false]]),
        ], captureHistory: true);

        TurboSign::addTemplateSignatureAnchor(new AddTemplateSignatureAnchorRequest(
            templateId: 'a/b',
            roleKey: 'signer_1',
            type: SignatureFieldType::TEXT,
            anchor: '{Company}',
            defaultValue: 'Acme',
            isReadonly: false,
        ));

        $this->assertStringContainsString(
            '/turbosign/templates/a%2Fb/signature-setup/anchors',
            (string) $this->requestHistory[0]['request']->getUri()
        );
        $this->assertEquals([
            'roleKey' => 'signer_1',
            'type' => 'text',
            'anchor' => '{Company}',
            'defaultValue' => 'Acme',
            'isReadonly' => false,
        ], $this->capturedJsonBody(0));
    }

    public function testAddTemplateSignatureAnchorSurfacesATagOwnedByAnotherRoleAsConflictWithCode(): void
    {
        $this->injectTurboSignClient([
            new Response(409, ['Content-Type' => 'application/json'], (string) json_encode([
                'message' => 'The tag {ClientSign} already belongs to another signer.',
                'type' => 'AnchorOwnedByOtherRole',
                'error' => 'x',
                'code' => 'AnchorOwnedByOtherRole',
            ])),
        ]);

        try {
            TurboSign::addTemplateSignatureAnchor(new AddTemplateSignatureAnchorRequest(
                templateId: self::TEMPLATE_ID,
                roleKey: 'signer_2',
                type: SignatureFieldType::SIGNATURE,
                anchor: '{ClientSign}',
            ));
            $this->fail('Expected ConflictException');
        } catch (ConflictException $e) {
            $this->assertSame('AnchorOwnedByOtherRole', $e->errorCode);
            $this->assertSame('The tag {ClientSign} already belongs to another signer.', $e->getMessage());
        }
    }

    public function testRemoveTemplateSignatureAnchorDeletesByEncodedIdAndReturnsTheSetup(): void
    {
        $remaining = self::SAVED_SETUP;
        $remaining['fields'] = [];
        $this->injectTurboSignClient([
            $this->ok(['results' => ['signatureSetup' => $remaining]]),
        ], captureHistory: true);

        $result = TurboSign::removeTemplateSignatureAnchor(self::TEMPLATE_ID, 'f/1');

        $request = $this->requestHistory[0]['request'];
        $this->assertSame('DELETE', $request->getMethod());
        $this->assertStringContainsString(
            '/turbosign/templates/' . self::TEMPLATE_ID . '/signature-setup/anchors/f%2F1',
            (string) $request->getUri()
        );
        $this->assertInstanceOf(RemoveTemplateSignatureAnchorResponse::class, $result);
        $this->assertSame([], $result->signatureSetup['fields']);
    }

    public function testRemoveTemplateSignatureAnchorSurfacesAnUnknownFieldAsNotFound(): void
    {
        $this->injectTurboSignClient([
            new Response(404, ['Content-Type' => 'application/json'], (string) json_encode([
                'message' => 'No anchored field with this id in the signature setup',
                'code' => 'SetupFieldNotFound',
            ])),
        ]);

        try {
            TurboSign::removeTemplateSignatureAnchor(self::TEMPLATE_ID, 'nope');
            $this->fail('Expected NotFoundException');
        } catch (NotFoundException $e) {
            $this->assertSame('SetupFieldNotFound', $e->errorCode);
        }
    }
}
