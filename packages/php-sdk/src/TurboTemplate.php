<?php

declare(strict_types=1);

namespace TurboDocx;

use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Requests\GenerateTemplateRequest;
use TurboDocx\Types\Responses\GenerateTemplateResponse;
use TurboDocx\Types\TemplateVariable;
use TurboDocx\Types\VariableMimeType;

/**
 * TurboTemplate - Advanced document templating operations
 *
 * Supports advanced templating features:
 * - Simple variable substitution: {customer_name}
 * - Nested objects: {user.firstName}
 * - Loops: {#products}...{/products}
 * - Conditionals: {#if condition}...{/if}
 * - Expressions: {price + tax}
 *
 * Static class matching TypeScript SDK API
 */
final class TurboTemplate
{
    private static ?HttpClient $client = null;

    /**
     * Configure TurboTemplate with API credentials
     *
     * @param HttpClientConfig $config Configuration object
     * @return void
     *
     * @example
     * ```php
     * TurboTemplate::configure(new HttpClientConfig(
     *     apiKey: $_ENV['TURBODOCX_API_KEY'],
     *     orgId: $_ENV['TURBODOCX_ORG_ID']
     * ));
     * ```
     */
    public static function configure(HttpClientConfig $config): void
    {
        self::$client = new HttpClient($config);
    }

    /**
     * Get client instance, auto-initialize from environment if needed
     *
     * @return HttpClient
     */
    private static function getClient(): HttpClient
    {
        if (self::$client === null) {
            // Auto-initialize from environment variables
            self::$client = new HttpClient(
                HttpClientConfig::fromEnvironment()
            );
        }
        return self::$client;
    }

    /**
     * Generate a document from a template with variables
     *
     * @param GenerateTemplateRequest $request Template ID and variables
     * @return GenerateTemplateResponse
     *
     * @example
     * ```php
     * // Simple variable substitution
     * $result = TurboTemplate::generate(
     *     new GenerateTemplateRequest(
     *         templateId: 'template-uuid',
     *         variables: [
     *             TemplateVariable::simple('{customer_name}', 'customer_name', 'John Doe'),
     *             TemplateVariable::simple('{order_total}', 'order_total', 1500)
     *         ]
     *     )
     * );
     *
     * // Advanced: nested objects with dot notation
     * $result = TurboTemplate::generate(
     *     new GenerateTemplateRequest(
     *         templateId: 'template-uuid',
     *         variables: [
     *             TemplateVariable::advancedEngine('{user}', 'user', [
     *                 'firstName' => 'John',
     *                 'email' => 'john@example.com'
     *             ])
     *         ]
     *     )
     * );
     * // Template can use: {user.firstName}, {user.email}
     *
     * // Advanced: loops with arrays
     * $result = TurboTemplate::generate(
     *     new GenerateTemplateRequest(
     *         templateId: 'template-uuid',
     *         variables: [
     *             TemplateVariable::loop('{products}', 'products', [
     *                 ['name' => 'Laptop', 'price' => 999],
     *                 ['name' => 'Mouse', 'price' => 29]
     *             ])
     *         ]
     *     )
     * );
     * // Template can use: {#products}{name}: ${price}{/products}
     * ```
     */
    public static function generate(GenerateTemplateRequest $request): GenerateTemplateResponse
    {
        $client = self::getClient();

        // Convert request to JSON body
        $body = $request->toArray();

        // Make POST request to /v1/deliverable
        $response = $client->post('/v1/deliverable', $body);

        return GenerateTemplateResponse::fromArray($response);
    }

    /**
     * Download a generated deliverable
     *
     * @param string $deliverableId ID of the deliverable to download
     * @param string $format Download format: 'source' (original DOCX/PPTX) or 'pdf'
     * @return string Document file content as binary string
     *
     * @example
     * ```php
     * // Download in original format (DOCX/PPTX)
     * $docContent = TurboTemplate::download('deliverable-uuid');
     * file_put_contents('document.docx', $docContent);
     *
     * // Download as PDF
     * $pdfContent = TurboTemplate::download('deliverable-uuid', 'pdf');
     * file_put_contents('document.pdf', $pdfContent);
     * ```
     */
    public static function download(string $deliverableId, string $format = 'source'): string
    {
        if (empty($deliverableId)) {
            throw new \InvalidArgumentException('deliverableId is required');
        }

        $client = self::getClient();

        $path = $format === 'pdf'
            ? "/v1/deliverable/file/pdf/{$deliverableId}"
            : "/v1/deliverable/file/{$deliverableId}";

        return $client->getRaw($path);
    }

    /**
     * Validate a variable configuration
     *
     * Checks if a variable is properly configured for advanced templating
     *
     * @param TemplateVariable $variable Variable to validate
     * @return array{isValid: bool, errors?: array<string>, warnings?: array<string>}
     */
    public static function validateVariable(TemplateVariable $variable): array
    {
        $errors = [];
        $warnings = [];

        // Check placeholder/name
        if (empty($variable->placeholder) || empty($variable->name)) {
            $errors[] = 'Variable must have both "placeholder" and "name" properties';
        }

        // Check value/text - allow null values, don't enforce either property

        // Check advanced templating settings
        if (is_array($variable->value) && !array_is_list($variable->value)) {
            // Associative array (object)
            if ($variable->mimeType !== VariableMimeType::JSON) {
                $warnings[] = 'Complex objects should explicitly set mimeType to "json"';
            }
        }

        // Check for arrays
        if (is_array($variable->value) && array_is_list($variable->value)) {
            if ($variable->mimeType !== VariableMimeType::JSON) {
                $warnings[] = 'Array values should use mimeType: "json"';
            }
        }

        // Check image variables
        if ($variable->mimeType === VariableMimeType::IMAGE) {
            if (!is_string($variable->value)) {
                $errors[] = 'Image variables must have a string value (URL or base64)';
            }
        }

        $result = ['isValid' => count($errors) === 0];
        if (count($errors) > 0) {
            $result['errors'] = $errors;
        }
        if (count($warnings) > 0) {
            $result['warnings'] = $warnings;
        }

        return $result;
    }
}
