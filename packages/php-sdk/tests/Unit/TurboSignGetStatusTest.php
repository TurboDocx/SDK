<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\TurboSign;
use TurboDocx\Types\Responses\DocumentStatusResponse;

/**
 * TurboSign::getStatus parses the signing-window deadline (expiresAt) off the status response.
 *
 * Mirrors the expiresAt-on-status coverage the other five SDKs already carry: expiration is
 * opt-in, so expiresAt is an ISO string when a document has a deadline and simply absent (parsed
 * as null) otherwise.
 */
final class TurboSignGetStatusTest extends TestCase
{
    /**
     * Configure TurboSign and wire its HttpClient to a Guzzle client that returns $responseBody
     * once, instead of making a real call.
     */
    private function configureWithResponse(string $responseBody): void
    {
        TurboSign::configure(new HttpClientConfig(
            apiKey: 'TDX-test',
            orgId: 'org-1',
            senderEmail: 'sender@company.com',
        ));

        $signRef = new ReflectionClass(TurboSign::class);
        $clientProp = $signRef->getProperty('client');
        $clientProp->setAccessible(true);
        $httpClient = $clientProp->getValue();

        $mock = new MockHandler([new Response(200, [], $responseBody)]);
        $stack = HandlerStack::create($mock);
        $guzzle = new Client(['handler' => $stack, 'base_uri' => 'http://localhost/']);

        $httpRef = new ReflectionClass($httpClient);
        $guzzleProp = $httpRef->getProperty('client');
        $guzzleProp->setAccessible(true);
        $guzzleProp->setValue($httpClient, $guzzle);
    }

    public function testGetStatusParsesExpiresAtWhenTheDocumentHasADeadline(): void
    {
        $this->configureWithResponse((string) json_encode(['data' => [
            'status' => 'under_review',
            'expiresAt' => '2026-08-02T23:59:59.000Z',
        ]]));

        $status = TurboSign::getStatus('doc-1');

        $this->assertInstanceOf(DocumentStatusResponse::class, $status);
        $this->assertSame('under_review', $status->status);
        $this->assertSame('2026-08-02T23:59:59.000Z', $status->expiresAt);
    }

    // Expiration is opt-in, so most documents never expire and the key is simply absent.
    public function testGetStatusLeavesExpiresAtNullWhenAbsent(): void
    {
        $this->configureWithResponse((string) json_encode(['data' => [
            'status' => 'under_review',
        ]]));

        $status = TurboSign::getStatus('doc-1');

        $this->assertNull($status->expiresAt);
        $this->assertSame('under_review', $status->status);
    }

    public function testGetStatusReportsTheTerminalExpiredStatusWithExpiresAt(): void
    {
        $this->configureWithResponse((string) json_encode(['data' => [
            'status' => 'expired',
            'expiresAt' => '2026-01-01T00:00:00.000Z',
        ]]));

        $status = TurboSign::getStatus('doc-1');

        $this->assertSame('expired', $status->status);
        $this->assertSame('2026-01-01T00:00:00.000Z', $status->expiresAt);
    }
}
