<?php

declare(strict_types=1);

namespace TurboDocx;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Psr\Http\Message\ResponseInterface;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Utils\ResponseNormalizer;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\AuthorizationException;
use TurboDocx\Exceptions\ConflictException;
use TurboDocx\Exceptions\NetworkException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\Exceptions\RateLimitException;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Utils\FileTypeDetector;

/**
 * HTTP client with generic type support via PHPDoc
 */
class HttpClient
{
    private Client $client;
    private ?string $senderEmail;
    private ?string $senderName;

    public function __construct(HttpClientConfig|PartnerClientConfig|QuoteClientConfig $config)
    {
        if ($config instanceof HttpClientConfig) {
            $this->senderEmail = $config->senderEmail;
            $this->senderName = $config->senderName;
        } else {
            $this->senderEmail = null;
            $this->senderName = null;
        }

        // Create Guzzle client
        $this->client = new Client([
            'base_uri' => $config->baseUrl,
            'headers' => $this->getHeaders($config),
            'timeout' => 30.0,
        ]);
    }

    /**
     * Get sender email and name configuration
     *
     * @return array{sender_email: ?string, sender_name: ?string}
     */
    public function getSenderConfig(): array
    {
        return [
            'sender_email' => $this->senderEmail,
            'sender_name' => $this->senderName,
        ];
    }

    /**
     * Smart unwrap response data
     * If response has ONLY "data" key, extract it
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private function smartUnwrap(array $data): array
    {
        if (count($data) === 1 && isset($data['data'])) {
            return $data['data'];
        }
        return $data;
    }

    /**
     * Generic GET request
     *
     * @param string $path
     * @param array<string, mixed> $params
     * @return mixed
     */
    public function get(string $path, array $params = []): mixed
    {
        try {
            $options = [];
            if (!empty($params)) {
                // Use Query::build for repeated-key serialization of array values
                // (e.g. statuses[]=draft&statuses[]=sent becomes statuses=draft&statuses=sent).
                $options['query'] = \GuzzleHttp\Psr7\Query::build($params);
            }
            $response = $this->client->get($path, $options);

            return ResponseNormalizer::normalizeResponse(
                $this->smartUnwrap($this->parseResponse($response))
            );
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generic POST request
     *
     * @param string $path
     * @param array<string, mixed>|null $data
     * @return mixed
     */
    public function post(string $path, ?array $data = null): mixed
    {
        try {
            $response = $this->client->post($path, [
                'json' => $data,
            ]);

            return ResponseNormalizer::normalizeResponse(
                $this->smartUnwrap($this->parseResponse($response))
            );
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generic PATCH request
     *
     * @param string $path
     * @param array<string, mixed>|null $data
     * @return mixed
     */
    public function patch(string $path, ?array $data = null): mixed
    {
        try {
            $response = $this->client->patch($path, [
                'json' => $data,
            ]);

            return ResponseNormalizer::normalizeResponse(
                $this->smartUnwrap($this->parseResponse($response))
            );
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * GET request returning raw binary response (for file downloads)
     *
     * @param string $path
     * @return string Raw response body as bytes
     */
    public function getRaw(string $path): string
    {
        try {
            $response = $this->client->get($path);
            return $response->getBody()->getContents();
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generic DELETE request
     *
     * @param string $path
     * @return mixed
     */
    public function delete(string $path): mixed
    {
        try {
            $response = $this->client->delete($path);

            return ResponseNormalizer::normalizeResponse(
                $this->smartUnwrap($this->parseResponse($response))
            );
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Upload file with multipart form data
     *
     * @param string $path
     * @param string $file File content (bytes)
     * @param string $fieldName Form field name
     * @param array<string, mixed> $additionalData Extra form fields
     * @return mixed
     */
    public function uploadFile(
        string $path,
        string $file,
        string $fieldName = 'file',
        array $additionalData = []
    ): mixed {
        // Detect file type using magic bytes
        $fileType = FileTypeDetector::detect($file);
        $fileName = $additionalData['fileName'] ?? "document.{$fileType['extension']}";
        unset($additionalData['fileName']);

        // Build multipart form data
        $multipart = [
            [
                'name' => $fieldName,
                'contents' => $file,
                'filename' => $fileName,
                'headers' => [
                    'Content-Type' => $fileType['mimetype'],
                ],
            ],
        ];

        // Add additional fields
        foreach ($additionalData as $key => $value) {
            $multipart[] = [
                'name' => $key,
                'contents' => is_array($value) ? json_encode($value) : (string) $value,
            ];
        }

        try {
            $response = $this->client->post($path, [
                'multipart' => $multipart,
            ]);

            return ResponseNormalizer::normalizeResponse(
                $this->smartUnwrap($this->parseResponse($response))
            );
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Handle Guzzle exceptions and map to custom exceptions
     *
     * @throws TurboDocxException
     * @return never
     */
    private function handleException(GuzzleException $e): never
    {
        if ($e instanceof RequestException && $e->hasResponse()) {
            $response = $e->getResponse();
            if ($response !== null) {
                $statusCode = $response->getStatusCode();
                $body = json_decode($response->getBody()->getContents(), true);
                $message = is_array($body)
                    ? ($body['message'] ?? $body['error'] ?? $e->getMessage())
                    : $e->getMessage();

                throw match ($statusCode) {
                    400 => new ValidationException($message, previous: $e),
                    401 => new AuthenticationException($message, previous: $e),
                    403 => new AuthorizationException($message, previous: $e),
                    404 => new NotFoundException($message, previous: $e),
                    409 => new ConflictException($message, previous: $e),
                    429 => new RateLimitException($message, previous: $e),
                    default => new TurboDocxException($message, $statusCode, previous: $e),
                };
            }
        }

        throw new NetworkException("Network request failed: {$e->getMessage()}", previous: $e);
    }

    /**
     * Parse JSON response
     *
     * @param ResponseInterface $response
     * @return array<string, mixed>
     */
    private function parseResponse(ResponseInterface $response): array
    {
        try {
            $decoded = json_decode($response->getBody()->getContents(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new TurboDocxException(
                "Failed to parse JSON response: {$e->getMessage()}",
                statusCode: $response->getStatusCode(),
                previous: $e,
            );
        }

        if (!is_array($decoded)) {
            throw new TurboDocxException(
                'Unexpected JSON response format: expected object or array',
                statusCode: $response->getStatusCode(),
            );
        }

        return $decoded;
    }

    /**
     * POST request with multipart form data (e.g. product images)
     *
     * @param string $path
     * @param array<array{name: string, contents: string, filename?: string, headers?: array<string, string>}> $multipart
     * @return mixed
     */
    public function postFormData(string $path, array $multipart): mixed
    {
        try {
            $response = $this->client->post($path, [
                'multipart' => $multipart,
            ]);

            return ResponseNormalizer::normalizeResponse(
                $this->smartUnwrap($this->parseResponse($response))
            );
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * PATCH request with multipart form data (e.g. product image updates)
     *
     * @param string $path
     * @param array<array{name: string, contents: string, filename?: string, headers?: array<string, string>}> $multipart
     * @return mixed
     */
    public function patchFormData(string $path, array $multipart): mixed
    {
        try {
            $response = $this->client->patch($path, [
                'multipart' => $multipart,
            ]);

            return ResponseNormalizer::normalizeResponse(
                $this->smartUnwrap($this->parseResponse($response))
            );
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get headers for requests
     *
     * @param HttpClientConfig|PartnerClientConfig|QuoteClientConfig $config
     * @return array<string, string>
     */
    private function getHeaders(HttpClientConfig|PartnerClientConfig|QuoteClientConfig $config): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];

        if ($config instanceof PartnerClientConfig) {
            $headers['Authorization'] = "Bearer {$config->partnerApiKey}";
        } elseif ($config instanceof QuoteClientConfig) {
            if (!empty($config->accessToken)) {
                $headers['Authorization'] = "Bearer {$config->accessToken}";
            } elseif (!empty($config->apiKey)) {
                $headers['Authorization'] = "Bearer {$config->apiKey}";
            }

            if (!empty($config->orgId)) {
                $headers['x-rapiddocx-org-id'] = $config->orgId;
            }
        } else {
            // HttpClientConfig
            if (!empty($config->accessToken)) {
                $headers['Authorization'] = "Bearer {$config->accessToken}";
            } elseif (!empty($config->apiKey)) {
                $headers['Authorization'] = "Bearer {$config->apiKey}";
            }

            if (!empty($config->orgId)) {
                $headers['x-rapiddocx-org-id'] = $config->orgId;
            }
        }

        return $headers;
    }
}
