<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\AuthorizationException;
use TurboDocx\Exceptions\ConflictException;
use TurboDocx\Exceptions\NetworkException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\Exceptions\RateLimitException;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\HttpClient;

/**
 * The API reports failures in several envelopes. Reading only the top-level message/error
 * loses the actionable reason ("senderEmail must be a valid email address") and the specific
 * code (QUOTE_NOT_FOUND) — and for the nested `error: {...}` shape used across TurboQuote,
 * would surface "Array" instead of the message.
 */
final class HttpClientErrorExtractionTest extends TestCase
{
    /**
     * @param array<string, mixed> $body
     */
    private function requestFailure(int $status, array $body): TurboDocxException
    {
        // JSON_THROW_ON_ERROR narrows json_encode's return from `string|false` to `string`,
        // which phpstan level 8 requires for Response's $body parameter. It also turns a
        // silently-malformed fixture into a visible failure.
        $mock = new MockHandler([
            new Response($status, ['Content-Type' => 'application/json'], json_encode($body, JSON_THROW_ON_ERROR)),
        ]);

        $config = new QuoteClientConfig(apiKey: 'test-key');
        $httpClient = new HttpClient($config);

        $handlerStack = HandlerStack::create($mock);
        $reflection = new ReflectionClass($httpClient);
        $prop = $reflection->getProperty('client');
        $prop->setValue($httpClient, new Client(['handler' => $handlerStack]));

        try {
            $httpClient->get('/anything');
        } catch (TurboDocxException $e) {
            return $e;
        }

        $this->fail('Expected a TurboDocxException to be thrown');
    }

    public function testSurfacesPerFieldReasonOverGenericEnvelope(): void
    {
        $error = $this->requestFailure(400, [
            'message' => 'There was an issue validating the body',
            'type' => 'ValidationError',
            'data' => ['errors' => [['message' => 'senderEmail must be a valid email address']]],
        ]);

        $this->assertInstanceOf(ValidationException::class, $error);
        $this->assertStringContainsString('senderEmail must be a valid email address', $error->getMessage());
    }

    public function testJoinsMultipleFieldErrors(): void
    {
        $error = $this->requestFailure(400, [
            'message' => 'There was an issue validating the body',
            'data' => ['errors' => [['message' => 'a is bad'], ['message' => 'b is required']]],
        ]);

        $this->assertStringContainsString('a is bad', $error->getMessage());
        $this->assertStringContainsString('b is required', $error->getMessage());
    }

    public function testFallsBackToTopLevelMessageAndReadsErrorAsCode(): void
    {
        $error = $this->requestFailure(400, [
            'message' => 'A sender email is required for API-key requests.',
            'error' => 'SenderEmailRequired',
        ]);

        $this->assertSame('A sender email is required for API-key requests.', $error->getMessage());
        // `error` alongside a `message` is the CODE, not the message.
        $this->assertSame('SenderEmailRequired', $error->errorCode);
    }

    public function testEmptyErrorsArrayDoesNotBlankTheMessage(): void
    {
        $error = $this->requestFailure(400, [
            'message' => 'There was an issue validating the body',
            'data' => ['errors' => []],
        ]);

        $this->assertSame('There was an issue validating the body', $error->getMessage());
    }

    public function testReadsMessageAndCodeFromNestedErrorObject(): void
    {
        $error = $this->requestFailure(404, [
            'error' => ['message' => 'Quote not found', 'code' => 'QUOTE_NOT_FOUND'],
        ]);

        $this->assertInstanceOf(NotFoundException::class, $error);
        $this->assertSame('Quote not found', $error->getMessage());
        $this->assertSame('QUOTE_NOT_FOUND', $error->errorCode);
    }

    public function testSurfacesTopLevelErrorsArrayForBulk(): void
    {
        $error = $this->requestFailure(400, [
            'message' => 'Bulk validation failed',
            'type' => 'BulkValidationFailed',
            'errors' => [['message' => 'Row 1 invalid'], ['message' => 'Row 3 required']],
        ]);

        $this->assertStringContainsString('Row 1 invalid', $error->getMessage());
        $this->assertStringContainsString('Row 3 required', $error->getMessage());
    }

    public function testReadsCodeFromTopLevelType(): void
    {
        $error = $this->requestFailure(400, [
            'message' => 'Recipient name is required',
            'type' => 'RecipientNameRequired',
        ]);

        $this->assertSame('RecipientNameRequired', $error->errorCode);
    }

    public function testLoneErrorStringIsTheMessageNotTheCode(): void
    {
        // SingleStepRoutes sends {error: <message>, code: <type>}.
        $error = $this->requestFailure(400, [
            'error' => 'Document could not be prepared',
            'code' => 'TemplateProcessingFailed',
        ]);

        $this->assertSame('Document could not be prepared', $error->getMessage());
        $this->assertSame('TemplateProcessingFailed', $error->errorCode);
    }

    public function testKeepsClassDefaultCodeWhenApiSendsNone(): void
    {
        $error = $this->requestFailure(404, ['message' => 'Resource missing']);

        $this->assertSame('NOT_FOUND', $error->errorCode);
    }

    public function testApiSuppliedCodeWinsOverClassDefault(): void
    {
        // The default must never mask a real code the backend sent.
        $error = $this->requestFailure(404, ['message' => 'Quote missing', 'code' => 'QUOTE_NOT_FOUND']);

        $this->assertSame('QUOTE_NOT_FOUND', $error->errorCode);
    }

    public function testEveryExceptionSubclassCarriesADefaultCode(): void
    {
        // Parity guard: all six SDKs populate `code` for every typed error.
        $this->assertSame('AUTHENTICATION_ERROR', (new AuthenticationException('x'))->errorCode);
        $this->assertSame('AUTHORIZATION_ERROR', (new AuthorizationException('x'))->errorCode);
        $this->assertSame('VALIDATION_ERROR', (new ValidationException('x'))->errorCode);
        $this->assertSame('NOT_FOUND', (new NotFoundException('x'))->errorCode);
        $this->assertSame('CONFLICT', (new ConflictException('x'))->errorCode);
        $this->assertSame('RATE_LIMIT_EXCEEDED', (new RateLimitException('x'))->errorCode);
        $this->assertSame('NETWORK_ERROR', (new NetworkException('x'))->errorCode);
    }
}
