<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\TurboSign;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Requests\CreateEmbeddedSignatureRequest;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;
use TurboDocx\Types\Requests\EmbeddedSignatureRecipient;
use TurboDocx\Types\Requests\SendSignatureRequest;
use TurboDocx\Types\Responses\TemplateSignatureRole;
use TurboDocx\Types\Responses\TemplateSignatureSetup;

/**
 * Template signer roles: a template set up in the TurboDocx UI (signers + fields dragged onto the
 * PDF) is sent by naming each signer's role. Runs the REAL HttpClient over a Guzzle MockHandler, so
 * the bodies asserted here are what goes over the wire. `recipients`/`fields` are JSON strings
 * inside the JSON body.
 */
final class TurboSignTemplateRolesTest extends TestCase
{
    use EmbeddedSigningTestSupport;

    private const TEMPLATE_ID = '84759112-d9d6-443a-bb78-87c427bd7948';

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

    public function testRecipientWithRoleNeedsNoSigningOrder(): void
    {
        $recipient = new Recipient(name: 'Jane Doe', email: 'jane@client.com', role: 'client');

        $this->assertNull($recipient->signingOrder);
        $this->assertSame(
            ['name' => 'Jane Doe', 'email' => 'jane@client.com', 'role' => 'client'],
            $recipient->toArray()
        );
    }

    public function testRecipientWithoutRoleStillRequiresSigningOrder(): void
    {
        $this->expectException(ValidationException::class);

        new Recipient(name: 'Jane Doe', email: 'jane@client.com');
    }

    public function testSendSignatureSendsRoleAndEmptyFieldsWhenOmitted(): void
    {
        $this->injectTurboSignClient([
            $this->ok(['success' => true, 'documentId' => 'doc-1', 'status' => 'under_review', 'message' => 'ok']),
        ], captureHistory: true);

        $result = TurboSign::sendSignature(new SendSignatureRequest(
            templateId: self::TEMPLATE_ID,
            recipients: [new Recipient(name: 'Jane Doe', email: 'jane@client.com', role: 'client')],
        ));

        $this->assertSame('doc-1', $result->documentId);
        $request = $this->requestHistory[0]['request'];
        $this->assertStringContainsString('/turbosign/single/prepare-for-signing', (string) $request->getUri());
        $body = $this->capturedJsonBody(0);
        $this->assertSame(self::TEMPLATE_ID, $body['templateId']);
        $this->assertSame(
            [['name' => 'Jane Doe', 'email' => 'jane@client.com', 'role' => 'client']],
            json_decode($body['recipients'], true)
        );
        $this->assertSame('[]', $body['fields']);
    }

    public function testSendSignatureSurfacesUnknownRoleMessageAndCode(): void
    {
        $message = 'Unknown role "clinet". This template\'s roles are: client, countersigner';
        $this->injectTurboSignClient([
            new Response(400, ['Content-Type' => 'application/json'], (string) json_encode([
                'message' => $message,
                'type' => 'UnknownSignerRole',
            ])),
        ]);

        try {
            TurboSign::sendSignature(new SendSignatureRequest(
                templateId: self::TEMPLATE_ID,
                recipients: [new Recipient(name: 'Jane Doe', email: 'jane@client.com', role: 'clinet')],
            ));
            $this->fail('Expected ValidationException');
        } catch (ValidationException $e) {
            $this->assertSame($message, $e->getMessage());
            $this->assertSame('UnknownSignerRole', $e->errorCode);
        }
    }

    public function testCreateSignatureReviewLinkSendsRoleAndEmptyFieldsWhenOmitted(): void
    {
        $this->injectTurboSignClient([
            $this->ok(['success' => true, 'documentId' => 'doc-2', 'status' => 'review_ready', 'message' => 'ok']),
        ], captureHistory: true);

        TurboSign::createSignatureReviewLink(new CreateSignatureReviewLinkRequest(
            templateId: self::TEMPLATE_ID,
            recipients: [new Recipient(name: 'Jane Doe', email: 'jane@client.com', role: 'client')],
        ));

        $request = $this->requestHistory[0]['request'];
        $this->assertStringContainsString('/turbosign/single/prepare-for-review', (string) $request->getUri());
        $body = $this->capturedJsonBody(0);
        $this->assertSame('client', json_decode($body['recipients'], true)[0]['role']);
        $this->assertSame('[]', $body['fields']);
    }

    public function testCreateEmbeddedSignaturePassesRoleThrough(): void
    {
        $this->injectTurboSignClient([
            $this->ok([
                'success' => true,
                'documentId' => 'doc-3',
                'status' => 'under_review',
                'message' => 'ok',
                'recipients' => [['id' => 'rec-1', 'name' => 'Jane Doe', 'email' => 'jane@client.com']],
            ]),
            $this->ok(['results' => [
                'url' => 'https://app/sign/doc-3?token=J',
                'expiresAt' => null,
                'recipientId' => 'rec-1',
            ]]),
        ], captureHistory: true);

        $result = TurboSign::createEmbeddedSignature(new CreateEmbeddedSignatureRequest(
            templateId: self::TEMPLATE_ID,
            recipients: [new EmbeddedSignatureRecipient(name: 'Jane Doe', email: 'jane@client.com', role: 'client')],
        ));

        $body = $this->capturedJsonBody(0);
        $this->assertSame(
            [['name' => 'Jane Doe', 'email' => 'jane@client.com', 'signingOrder' => 1, 'role' => 'client']],
            json_decode($body['recipients'], true)
        );
        $this->assertSame('[]', $body['fields']);
        $this->assertSame('https://app/sign/doc-3?token=J', $result->recipients[0]->embedUrl);
    }

    public function testGetTemplateSignatureSetupGetsAndUnwrapsRoles(): void
    {
        $this->injectTurboSignClient([
            $this->ok([
                'templateId' => self::TEMPLATE_ID,
                'roles' => [
                    ['key' => 'client', 'label' => 'Client', 'order' => 1, 'hasSavedSigner' => false, 'fieldCount' => 3],
                    [
                        'key' => 'countersigner',
                        'label' => 'Countersigner',
                        'order' => 2,
                        'hasSavedSigner' => true,
                        'defaultName' => 'Sam Lee',
                        'defaultEmail' => 'sam@acme.com',
                        'fieldCount' => 2,
                    ],
                ],
            ]),
        ], captureHistory: true);

        $setup = TurboSign::getTemplateSignatureSetup(self::TEMPLATE_ID);

        $request = $this->requestHistory[0]['request'];
        $this->assertSame('GET', $request->getMethod());
        $this->assertStringContainsString(
            '/turbosign/templates/' . self::TEMPLATE_ID . '/signature-setup',
            (string) $request->getUri()
        );

        $this->assertInstanceOf(TemplateSignatureSetup::class, $setup);
        $this->assertSame(self::TEMPLATE_ID, $setup->templateId);
        $this->assertCount(2, $setup->roles);
        $this->assertContainsOnlyInstancesOf(TemplateSignatureRole::class, $setup->roles);

        $client = $setup->roles[0];
        $this->assertSame('client', $client->key);
        $this->assertSame('Client', $client->label);
        $this->assertSame(1, $client->order);
        $this->assertFalse($client->hasSavedSigner);
        $this->assertNull($client->defaultName);
        $this->assertNull($client->defaultEmail);
        $this->assertSame(3, $client->fieldCount);

        $counter = $setup->roles[1];
        $this->assertSame('countersigner', $counter->key);
        $this->assertSame(2, $counter->order);
        $this->assertTrue($counter->hasSavedSigner);
        $this->assertSame('Sam Lee', $counter->defaultName);
        $this->assertSame('sam@acme.com', $counter->defaultEmail);
        $this->assertSame(2, $counter->fieldCount);
    }

    public function testGetTemplateSignatureSetupUrlEncodesTemplateId(): void
    {
        $this->injectTurboSignClient([
            $this->ok(['templateId' => 'a/b', 'roles' => []]),
        ], captureHistory: true);

        TurboSign::getTemplateSignatureSetup('a/b');

        $request = $this->requestHistory[0]['request'];
        $this->assertStringContainsString('/turbosign/templates/a%2Fb/signature-setup', (string) $request->getUri());
    }
}
