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
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\TurboSign;
use TurboDocx\Types\Requests\SendSignatureRequest;

/**
 * Regression: schedule booleans on the multipart (file-upload) signature path must serialize as
 * the STRINGS "true" / "false", not PHP's default (string) cast of a bool — which yields "1" for
 * true and "" (empty string) for false and is rejected by the backend's Joi.boolean() coercion.
 *
 * The existing schedule test only inspects the pre-serialization $formData array (where the value
 * is still a native PHP bool), so it never exercises the multipart 'contents' serialization where
 * the bug lived. This test drives the REAL uploadFile() path end to end: it injects a Guzzle
 * client backed by MockHandler + a history middleware, sends a file (which forces multipart), and
 * asserts against the actual multipart body Guzzle builds on the wire.
 */
final class TurboSignMultipartBooleanTest extends TestCase
{
    /**
     * Configure TurboSign, wire a capturing Guzzle client into its HttpClient, and return the
     * request-history array that will hold the outgoing multipart request.
     *
     * @param array<int, array<string, mixed>> $history
     */
    private function configureWithCapture(array &$history): void
    {
        TurboSign::configure(new HttpClientConfig(
            apiKey: 'TDX-test',
            orgId: 'org-1',
            senderEmail: 'sender@company.com',
            senderName: 'Sender',
        ));

        // Reach the HttpClient instance TurboSign just built...
        $signRef = new ReflectionClass(TurboSign::class);
        $clientProp = $signRef->getProperty('client');
        $clientProp->setAccessible(true);
        $httpClient = $clientProp->getValue();

        // ...and replace its internal Guzzle client with one that records requests and returns a
        // canned success body instead of making a real call.
        $mock = new MockHandler([
            new Response(200, [], json_encode(['data' => [
                'documentId' => 'doc-1',
                'status' => 'under_review',
                'message' => 'ok',
            ]])),
        ]);
        $stack = HandlerStack::create($mock);
        $stack->push(Middleware::history($history));
        $guzzle = new Client(['handler' => $stack, 'base_uri' => 'http://localhost/']);

        $httpRef = new ReflectionClass($httpClient);
        $guzzleProp = $httpRef->getProperty('client');
        $guzzleProp->setAccessible(true);
        $guzzleProp->setValue($httpClient, $guzzle);
    }

    /**
     * Extract a single form field's raw value out of a serialized multipart body.
     */
    private function multipartField(string $body, string $name): ?string
    {
        // Guzzle emits per-part headers (e.g. Content-Length) between the Content-Disposition
        // line and the value, so skip anything up to the first blank line, then capture the value
        // up to the next boundary.
        $pattern = '/name="' . preg_quote($name, '/') . '".*?\r?\n\r?\n(.*?)\r?\n--/s';
        if (preg_match($pattern, $body, $matches) === 1) {
            return $matches[1];
        }
        return null;
    }

    public function testMultipartSerializesRemindersEnabledTrueAndExpirationEnabledFalse(): void
    {
        $history = [];
        $this->configureWithCapture($history);

        TurboSign::sendSignature(new SendSignatureRequest(
            recipients: [],
            fields: [],
            file: '%PDF-1.4 fake pdf bytes',
            remindersEnabled: true,
            expirationEnabled: false,
        ));

        $this->assertCount(1, $history, 'exactly one multipart request should have been sent');
        $body = (string) $history[0]['request']->getBody();

        // true -> "true", NOT PHP's "1"
        $this->assertSame('true', $this->multipartField($body, 'remindersEnabled'));
        // false -> "false", NOT PHP's "" (empty string)
        $this->assertSame('false', $this->multipartField($body, 'expirationEnabled'));

        // Guard the exact bug: the discarded PHP casts must not appear for these fields.
        $this->assertStringNotContainsString("name=\"remindersEnabled\"\r\n\r\n1\r\n", $body);
        $this->assertStringNotContainsString("name=\"expirationEnabled\"\r\n\r\n\r\n", $body);
    }

    public function testMultipartSerializesRemindersEnabledFalseAndExpirationEnabledTrue(): void
    {
        $history = [];
        $this->configureWithCapture($history);

        TurboSign::sendSignature(new SendSignatureRequest(
            recipients: [],
            fields: [],
            file: '%PDF-1.4 fake pdf bytes',
            remindersEnabled: false,
            expirationEnabled: true,
        ));

        $body = (string) $history[0]['request']->getBody();

        $this->assertSame('false', $this->multipartField($body, 'remindersEnabled'));
        $this->assertSame('true', $this->multipartField($body, 'expirationEnabled'));
    }
}
