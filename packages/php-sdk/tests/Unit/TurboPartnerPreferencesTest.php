<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\RequestInterface;
use ReflectionClass;
use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\HttpClient;
use TurboDocx\TurboPartner;

/**
 * Tests for TurboPartner org-preferences methods.
 *
 * Mirrors the js-sdk turbopartner preference tests:
 *   - getOrganizationPreferences GETs the right path and returns the effective values
 *   - updateOrganizationPreferences PATCHes only the given keys wrapped in a
 *     `preferences` envelope to the right path
 *
 * Uses a Guzzle MockHandler (matching TurboWebhooksTest) plus a history middleware
 * to capture the outgoing request path and body.
 */
final class TurboPartnerPreferencesTest extends TestCase
{
    private const PARTNER_ID = '11111111-1111-4111-8111-111111111111';

    /** @var array<int, array<string, mixed>> */
    private array $requestHistory = [];

    protected function setUp(): void
    {
        $this->resetPartnerClient();
        $this->requestHistory = [];
    }

    protected function tearDown(): void
    {
        $this->resetPartnerClient();
    }

    private function resetPartnerClient(): void
    {
        $ref = new ReflectionClass(TurboPartner::class);
        foreach (['client', 'config'] as $name) {
            $prop = $ref->getProperty($name);
            $prop->setAccessible(true);
            $prop->setValue(null, null);
        }
    }

    /**
     * Install a mocked HTTP client on TurboPartner that returns $body for the next
     * request and records the outgoing request into $this->requestHistory.
     */
    private function installMockClient(int $status, string $body): void
    {
        $config = new PartnerClientConfig(
            partnerApiKey: 'TDXP-test',
            partnerId: self::PARTNER_ID,
            baseUrl: 'http://localhost/',
        );
        $http = new HttpClient($config);

        $mock = new MockHandler([new Response($status, [], $body)]);
        $stack = HandlerStack::create($mock);
        $stack->push(Middleware::history($this->requestHistory));
        $guzzle = new Client(['handler' => $stack, 'base_uri' => 'http://localhost/']);

        $httpRef = new ReflectionClass($http);
        $guzzleProp = $httpRef->getProperty('client');
        $guzzleProp->setAccessible(true);
        $guzzleProp->setValue($http, $guzzle);

        $partnerRef = new ReflectionClass(TurboPartner::class);
        $clientProp = $partnerRef->getProperty('client');
        $clientProp->setAccessible(true);
        $clientProp->setValue(null, $http);
        $configProp = $partnerRef->getProperty('config');
        $configProp->setAccessible(true);
        $configProp->setValue(null, $config);
    }

    private function lastRequest(): RequestInterface
    {
        $this->assertNotEmpty($this->requestHistory, 'No HTTP request was captured');
        return $this->requestHistory[count($this->requestHistory) - 1]['request'];
    }

    public function testGetOrganizationPreferencesGetsPathAndReturnsEffectiveValues(): void
    {
        $this->installMockClient(200, json_encode([
            'success' => true,
            'data' => [
                'preferences' => [
                    'hideSignatureOutline' => false,
                    'hideSignatureHash' => false,
                    'lockedFieldsBackground' => true,
                    'allowDownloadBeforeSigning' => false,
                ],
            ],
        ]) ?: '');

        $result = TurboPartner::getOrganizationPreferences('org-1');

        $this->assertTrue($result->preferences->lockedFieldsBackground);
        $this->assertFalse($result->preferences->hideSignatureOutline);
        $this->assertFalse($result->preferences->allowDownloadBeforeSigning);

        $request = $this->lastRequest();
        $this->assertSame('GET', $request->getMethod());
        $this->assertSame(
            '/partner/' . self::PARTNER_ID . '/organizations/org-1/preferences',
            $request->getUri()->getPath(),
        );
    }

    public function testUpdateOrganizationPreferencesPatchesOnlyGivenKeysWrappedInEnvelope(): void
    {
        $this->installMockClient(200, json_encode([
            'success' => true,
            'data' => [
                'preferences' => [
                    'hideSignatureOutline' => false,
                    'hideSignatureHash' => false,
                    'lockedFieldsBackground' => false,
                    'allowDownloadBeforeSigning' => false,
                ],
            ],
        ]) ?: '');

        $result = TurboPartner::updateOrganizationPreferences('org-1', [
            'lockedFieldsBackground' => false,
        ]);

        $this->assertFalse($result->preferences->lockedFieldsBackground);

        $request = $this->lastRequest();
        $this->assertSame('PATCH', $request->getMethod());
        $this->assertSame(
            '/partner/' . self::PARTNER_ID . '/organizations/org-1/preferences',
            $request->getUri()->getPath(),
        );

        // The body wraps only the given key under a `preferences` envelope,
        // matching the backend PATCH contract. Keys stay camelCase verbatim.
        $sentBody = json_decode((string) $request->getBody(), true);
        $this->assertSame(
            ['preferences' => ['lockedFieldsBackground' => false]],
            $sentBody,
        );
    }
}
