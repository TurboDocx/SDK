<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Exceptions\ConflictException;
use TurboDocx\HttpClient;

/**
 * HttpClient::put — a JSON PUT (used by reorderLineItemImages), unwrapped like every other call,
 * and the 409 a refused quote delete comes back as.
 */
final class HttpClientPutTest extends TestCase
{
    /** @var array<int, array<string, mixed>> */
    private array $history = [];

    private function clientWith(Response $response): HttpClient
    {
        $stack = HandlerStack::create(new MockHandler([$response]));
        $stack->push(Middleware::history($this->history));

        $httpClient = new HttpClient(new QuoteClientConfig(apiKey: 'test-key'));
        $prop = (new ReflectionClass($httpClient))->getProperty('client');
        $prop->setValue($httpClient, new Client(['handler' => $stack]));
        return $httpClient;
    }

    public function testPutSendsJsonAndUnwrapsData(): void
    {
        $client = $this->clientWith(new Response(200, ['Content-Type' => 'application/json'], json_encode(
            ['data' => ['results' => [['id' => 'img-2']], 'message' => 'Image order saved']],
            JSON_THROW_ON_ERROR
        )));

        $result = $client->put('/v1/quotes/q-1/items/li-1/images/order', ['imageIds' => ['img-2']]);

        $request = $this->history[0]['request'];
        $this->assertSame('PUT', $request->getMethod());
        $this->assertStringEndsWith('/v1/quotes/q-1/items/li-1/images/order', (string) $request->getUri());
        $this->assertSame(['imageIds' => ['img-2']], json_decode((string) $request->getBody(), true));
        $this->assertSame([['id' => 'img-2']], $result['results']);
    }

    public function testRefusedQuoteDeleteIsAConflictWithItsCode(): void
    {
        $message = "A sent quote can't be deleted. Void it instead.";
        $client = $this->clientWith(new Response(409, ['Content-Type' => 'application/json'], json_encode([
            'message' => $message,
            'error' => ['message' => $message, 'code' => 'CANNOT_DELETE_SENT_QUOTE'],
            'data' => [],
        ], JSON_THROW_ON_ERROR)));

        try {
            $client->delete('/v1/quotes/q-1');
            $this->fail('Expected a ConflictException');
        } catch (ConflictException $e) {
            $this->assertSame(409, $e->statusCode);
            $this->assertSame('CANNOT_DELETE_SENT_QUOTE', $e->errorCode);
            $this->assertSame($message, $e->getMessage());
        }
    }
}
