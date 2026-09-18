<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\HttpClient;
use TurboDocx\TurboSign;

/**
 * Shared plumbing for the embedded-signing tests.
 *
 * Mirrors HttpClientTest: build a real HttpClient, then swap its internal Guzzle client for one
 * backed by MockHandler so each scenario short-circuits with a canned status + JSON body. The
 * resulting HttpClient is injected into TurboSign's private static $client so the REAL methods run
 * against the mock transport.
 *
 * @mixin TestCase
 */
trait EmbeddedSigningTestSupport
{
    /**
     * Captured Guzzle request/response history (populated when $captureHistory is true).
     *
     * @var array<int, array<string, mixed>>
     */
    protected array $requestHistory = [];

    /**
     * Build an HttpClient whose transport replays the given canned responses in order.
     *
     * @param array<\GuzzleHttp\Psr7\Response> $responses
     */
    protected function makeMockClient(array $responses, bool $captureHistory = false): HttpClient
    {
        $config = new HttpClientConfig(
            apiKey: 'TDX-test',
            orgId: 'org-1',
            skipSenderValidation: true,
        );
        $http = new HttpClient($config);

        $mock = new MockHandler($responses);
        $stack = HandlerStack::create($mock);
        if ($captureHistory) {
            $this->requestHistory = [];
            $stack->push(Middleware::history($this->requestHistory));
        }
        $guzzle = new Client(['handler' => $stack, 'base_uri' => 'http://localhost/']);

        $ref = new ReflectionClass($http);
        $prop = $ref->getProperty('client');
        $prop->setAccessible(true);
        $prop->setValue($http, $guzzle);

        return $http;
    }

    /**
     * Inject an HttpClient into TurboSign's private static $client.
     *
     * @param array<\GuzzleHttp\Psr7\Response> $responses
     */
    protected function injectTurboSignClient(array $responses, bool $captureHistory = false): void
    {
        $client = $this->makeMockClient($responses, $captureHistory);
        $ref = new ReflectionClass(TurboSign::class);
        $prop = $ref->getProperty('client');
        $prop->setAccessible(true);
        $prop->setValue(null, $client);
    }

    /**
     * Reset TurboSign's static client so tests never leak state into one another.
     */
    protected function resetTurboSignClient(): void
    {
        $ref = new ReflectionClass(TurboSign::class);
        $prop = $ref->getProperty('client');
        $prop->setAccessible(true);
        $prop->setValue(null, null);
    }

    /**
     * Decode the JSON body of the Nth captured request.
     *
     * @return array<string, mixed>
     */
    protected function capturedJsonBody(int $index = 0): array
    {
        $request = $this->requestHistory[$index]['request'];
        $decoded = json_decode((string) $request->getBody(), true);
        return is_array($decoded) ? $decoded : [];
    }
}
