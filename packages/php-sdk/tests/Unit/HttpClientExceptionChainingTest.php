<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\NetworkException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\Exceptions\RateLimitException;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\HttpClient;

/**
 * Tests that exception chaining (previous exception) is preserved
 * when Guzzle exceptions are mapped to SDK exceptions.
 */
final class HttpClientExceptionChainingTest extends TestCase
{
    /**
     * Create an HttpClient with a mocked Guzzle client.
     *
     * @param MockHandler $mockHandler
     * @return HttpClient
     */
    private function createClientWithMock(MockHandler $mockHandler): HttpClient
    {
        $config = new QuoteClientConfig(apiKey: 'test-key');
        $httpClient = new HttpClient($config);

        // Swap internal Guzzle client via reflection
        $handlerStack = HandlerStack::create($mockHandler);
        $mockGuzzle = new Client(['handler' => $handlerStack]);

        $reflection = new ReflectionClass($httpClient);
        $prop = $reflection->getProperty('client');
        $prop->setValue($httpClient, $mockGuzzle);

        return $httpClient;
    }

    public function testNetworkExceptionPreservesPreviousOnConnectFailure(): void
    {
        $connectException = new ConnectException(
            'Connection refused',
            new Request('GET', '/test')
        );

        $mock = new MockHandler([$connectException]);
        $client = $this->createClientWithMock($mock);

        try {
            $client->get('/test');
            $this->fail('Expected NetworkException was not thrown');
        } catch (NetworkException $e) {
            $this->assertNotNull(
                $e->getPrevious(),
                'NetworkException should chain the original ConnectException as previous'
            );
            $this->assertInstanceOf(ConnectException::class, $e->getPrevious());
        }
    }

    public function testValidationExceptionPreservesPreviousOn400(): void
    {
        $response = new Response(400, [], (string) json_encode(['message' => 'Bad request']));
        $requestException = RequestException::create(
            new Request('POST', '/test'),
            $response
        );

        $mock = new MockHandler([$requestException]);
        $client = $this->createClientWithMock($mock);

        try {
            $client->post('/test', ['data' => 'value']);
            $this->fail('Expected ValidationException was not thrown');
        } catch (ValidationException $e) {
            $this->assertNotNull(
                $e->getPrevious(),
                'ValidationException should chain the original RequestException as previous'
            );
            $this->assertInstanceOf(RequestException::class, $e->getPrevious());
        }
    }

    public function testAuthenticationExceptionPreservesPreviousOn401(): void
    {
        $response = new Response(401, [], (string) json_encode(['message' => 'Unauthorized']));
        $requestException = RequestException::create(
            new Request('GET', '/test'),
            $response
        );

        $mock = new MockHandler([$requestException]);
        $client = $this->createClientWithMock($mock);

        try {
            $client->get('/test');
            $this->fail('Expected AuthenticationException was not thrown');
        } catch (AuthenticationException $e) {
            $this->assertNotNull(
                $e->getPrevious(),
                'AuthenticationException should chain the original RequestException as previous'
            );
            $this->assertInstanceOf(RequestException::class, $e->getPrevious());
        }
    }

    public function testNotFoundExceptionPreservesPreviousOn404(): void
    {
        $response = new Response(404, [], (string) json_encode(['message' => 'Not found']));
        $requestException = RequestException::create(
            new Request('GET', '/test/123'),
            $response
        );

        $mock = new MockHandler([$requestException]);
        $client = $this->createClientWithMock($mock);

        try {
            $client->get('/test/123');
            $this->fail('Expected NotFoundException was not thrown');
        } catch (NotFoundException $e) {
            $this->assertNotNull(
                $e->getPrevious(),
                'NotFoundException should chain the original RequestException as previous'
            );
            $this->assertInstanceOf(RequestException::class, $e->getPrevious());
        }
    }

    public function testRateLimitExceptionPreservesPreviousOn429(): void
    {
        $response = new Response(429, [], (string) json_encode(['message' => 'Rate limited']));
        $requestException = RequestException::create(
            new Request('POST', '/test'),
            $response
        );

        $mock = new MockHandler([$requestException]);
        $client = $this->createClientWithMock($mock);

        try {
            $client->post('/test');
            $this->fail('Expected RateLimitException was not thrown');
        } catch (RateLimitException $e) {
            $this->assertNotNull(
                $e->getPrevious(),
                'RateLimitException should chain the original RequestException as previous'
            );
            $this->assertInstanceOf(RequestException::class, $e->getPrevious());
        }
    }

    public function testTurboDocxExceptionPreservesPreviousOnOtherStatusCodes(): void
    {
        $response = new Response(503, [], (string) json_encode(['message' => 'Service unavailable']));
        $requestException = RequestException::create(
            new Request('GET', '/test'),
            $response
        );

        $mock = new MockHandler([$requestException]);
        $client = $this->createClientWithMock($mock);

        try {
            $client->get('/test');
            $this->fail('Expected TurboDocxException was not thrown');
        } catch (TurboDocxException $e) {
            $this->assertNotNull(
                $e->getPrevious(),
                'TurboDocxException should chain the original RequestException as previous'
            );
            $this->assertInstanceOf(RequestException::class, $e->getPrevious());
        }
    }
}
