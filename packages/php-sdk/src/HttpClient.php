<?php

declare(strict_types=1);

namespace TurboDocx;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Psr\Http\Message\ResponseInterface;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\NetworkException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\Exceptions\RateLimitException;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Utils\FileTypeDetector;

/**
 * HTTP client with generic type support via PHPDoc
 */
final class HttpClient
{
    private Client $client;
    private ?string $senderEmail;
    private ?string $senderName;

    public function __construct(HttpClientConfig|PartnerClientConfig $config)
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
     * @return array<string, mixed>
     */
    public function get(string $path, array $params = []): mixed
    {
        try {
            $response = $this->client->get($path, [
                'query' => $params,
            ]);

            return $this->smartUnwrap($this->parseResponse($response));
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generic POST request
     *
     * @param string $path
     * @param array<string, mixed>|null $data
     * @return array<string, mixed>
     */
    public function post(string $path, ?array $data = null): mixed
    {
        try {
            $response = $this->client->post($path, [
                'json' => $data,
            ]);

            return $this->smartUnwrap($this->parseResponse($response));
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generic PATCH request
     *
     * @param string $path
     * @param array<string, mixed>|null $data
     * @return array<string, mixed>
     */
    public function patch(string $path, ?array $data = null): mixed
    {
        try {
            $response = $this->client->patch($path, [
                'json' => $data,
            ]);

            return $this->smartUnwrap($this->parseResponse($response));
        } catch (GuzzleException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generic DELETE request
     *
     * @param string $path
     * @return array<string, mixed>
     */
    public function delete(string $path): mixed
    {
        try {
            $response = $this->client->delete($path);

            return $this->smartUnwrap($this->parseResponse($response));
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
     * @return array<string, mixed>
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

            return $this->smartUnwrap($this->parseResponse($response));
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
                $message = $body['message'] ?? $body['error'] ?? $e->getMessage();

                throw match ($statusCode) {
                    400 => new ValidationException($message),
                    401 => new AuthenticationException($message),
                    404 => new NotFoundException($message),
                    429 => new RateLimitException($message),
                    default => new TurboDocxException($message, $statusCode),
                };
            }
        }

        throw new NetworkException("Network request failed: {$e->getMessage()}");
    }

    /**
     * Parse JSON response
     *
     * @param ResponseInterface $response
     * @return array<string, mixed>
     */
    private function parseResponse(ResponseInterface $response): array
    {
        return json_decode($response->getBody()->getContents(), true);
    }

    /**
     * Get headers for requests
     *
     * @param HttpClientConfig|PartnerClientConfig $config
     * @return array<string, string>
     */
    private function getHeaders(HttpClientConfig|PartnerClientConfig $config): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];

        if ($config instanceof PartnerClientConfig) {
            $headers['Authorization'] = "Bearer {$config->partnerApiKey}";
        } else {
            // Authorization
            if (!empty($config->accessToken)) {
                $headers['Authorization'] = "Bearer {$config->accessToken}";
            } elseif (!empty($config->apiKey)) {
                $headers['Authorization'] = "Bearer {$config->apiKey}";
            }

            // Organization ID
            if (!empty($config->orgId)) {
                $headers['x-rapiddocx-org-id'] = $config->orgId;
            }
        }

        return $headers;
    }
}
