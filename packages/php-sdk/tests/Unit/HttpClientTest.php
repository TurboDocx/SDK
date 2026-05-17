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
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\AuthorizationException;
use TurboDocx\Exceptions\ConflictException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\Exceptions\RateLimitException;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\HttpClient;

/**
 * Tests for HttpClient's HTTP status -> typed-exception mapping.
 *
 * We replace the internal Guzzle client with one backed by MockHandler so
 * each scenario short-circuits with a canned status + JSON body, then assert
 * the correct exception subclass is thrown.
 */
final class HttpClientTest extends TestCase
{
    private function buildHttpClient(int $status, string $body): HttpClient
    {
        $config = new HttpClientConfig(
            apiKey: 'TDX-test',
            orgId: 'org-1',
            skipSenderValidation: true,
        );
        $http = new HttpClient($config);

        $mock = new MockHandler([new Response($status, [], $body)]);
        $stack = HandlerStack::create($mock);
        $guzzle = new Client(['handler' => $stack, 'base_uri' => 'http://localhost/']);

        $ref = new ReflectionClass($http);
        $prop = $ref->getProperty('client');
        $prop->setAccessible(true);
        $prop->setValue($http, $guzzle);

        return $http;
    }

    public function test400MapsToValidationException(): void
    {
        $client = $this->buildHttpClient(400, '{"message":"bad input"}');
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('bad input');
        $client->get('/anything');
    }

    public function test401MapsToAuthenticationException(): void
    {
        $client = $this->buildHttpClient(401, '{"message":"bad key"}');
        $this->expectException(AuthenticationException::class);
        $client->get('/anything');
    }

    public function test403MapsToAuthorizationException(): void
    {
        $client = $this->buildHttpClient(403, '{"message":"forbidden"}');
        $this->expectException(AuthorizationException::class);
        $client->get('/anything');
    }

    public function test404MapsToNotFoundException(): void
    {
        $client = $this->buildHttpClient(404, '{"message":"gone"}');
        $this->expectException(NotFoundException::class);
        $client->get('/anything');
    }

    public function test409MapsToConflictException(): void
    {
        $client = $this->buildHttpClient(
            409,
            '{"message":"Webhook with this name already exists"}',
        );
        $this->expectException(ConflictException::class);
        $this->expectExceptionMessage('Webhook with this name already exists');
        $client->post('/api/webhooks', ['name' => 'signature']);
    }

    public function test429MapsToRateLimitException(): void
    {
        $client = $this->buildHttpClient(429, '{"message":"slow down"}');
        $this->expectException(RateLimitException::class);
        $client->get('/anything');
    }

    public function test500MapsToBaseTurboDocxException(): void
    {
        $client = $this->buildHttpClient(500, '{"message":"boom"}');
        try {
            $client->get('/anything');
            $this->fail('Expected TurboDocxException');
        } catch (TurboDocxException $e) {
            // Must be the base type, not any of the typed subclasses.
            $this->assertSame(TurboDocxException::class, $e::class);
            $this->assertSame(500, $e->statusCode);
        }
    }
}
