<?php

declare(strict_types=1);

namespace TurboDocx;

use TurboDocx\Config\DeliverableConfig;

/**
 * Deliverable - Document generation and management operations
 *
 * Provides operations for generating documents from templates,
 * managing deliverables, and downloading files.
 *
 * Static class matching TypeScript SDK API.
 */
final class Deliverable
{
    private static ?HttpClient $client = null;

    /**
     * Configure Deliverable with API credentials
     *
     * @param DeliverableConfig $config Configuration object (no senderEmail needed)
     * @return void
     *
     * @example
     * ```php
     * Deliverable::configure(new DeliverableConfig(
     *     apiKey: $_ENV['TURBODOCX_API_KEY'],
     *     orgId: $_ENV['TURBODOCX_ORG_ID'],
     * ));
     * ```
     */
    public static function configure(DeliverableConfig $config): void
    {
        self::$client = new HttpClient($config->toHttpClientConfig());
    }

    /**
     * Get client instance, auto-initialize from environment if needed
     *
     * @return HttpClient
     */
    private static function getClient(): HttpClient
    {
        if (self::$client === null) {
            self::$client = new HttpClient(
                DeliverableConfig::fromEnvironment()->toHttpClientConfig()
            );
        }
        return self::$client;
    }

    // ============================================
    // DELIVERABLE CRUD
    // ============================================

    /**
     * List deliverables with pagination, search, and filtering
     *
     * @param array{
     *     limit?: int,
     *     offset?: int,
     *     query?: string,
     *     showTags?: bool
     * } $options Query options
     * @return array<string, mixed> Contains 'results' (array of deliverable records) and 'totalRecords' (int)
     *
     * @example
     * ```php
     * $result = Deliverable::listDeliverables(['limit' => 10, 'showTags' => true]);
     * echo "Found {$result['totalRecords']} deliverables";
     * ```
     */
    public static function listDeliverables(array $options = []): array
    {
        $client = self::getClient();
        $params = self::buildListParams($options);
        unset($params['column0'], $params['order0']);
        return $client->get('/v1/deliverable', $params);
    }

    /**
     * Generate a new deliverable document from a template with variable substitution
     *
     * @param array<string, mixed> $request Must include 'name', 'templateId', 'variables'; optional 'description', 'tags'
     * @return array<string, mixed> Contains 'results' with nested 'deliverable' object
     *
     * @example
     * ```php
     * $result = Deliverable::generateDeliverable([
     *     'name' => 'Employee Contract',
     *     'templateId' => 'your-template-id',
     *     'variables' => [
     *         ['placeholder' => '{EmployeeName}', 'text' => 'John Smith', 'mimeType' => 'text'],
     *     ],
     *     'tags' => ['hr', 'contract'],
     * ]);
     * ```
     */
    public static function generateDeliverable(array $request): array
    {
        $client = self::getClient();
        return $client->post('/v1/deliverable', $request);
    }

    /**
     * Get full details of a single deliverable
     *
     * @param string $id Deliverable UUID
     * @param bool $showTags Include tags in response
     * @return array<string, mixed> Full deliverable record (unwrapped from 'results')
     *
     * @example
     * ```php
     * $details = Deliverable::getDeliverableDetails('uuid', showTags: true);
     * echo $details['name'];
     * ```
     */
    public static function getDeliverableDetails(string $id, bool $showTags = false): array
    {
        $client = self::getClient();
        $params = $showTags ? ['showTags' => 'true'] : [];
        $response = $client->get("/v1/deliverable/{$id}", $params);
        return $response['results'];
    }

    /**
     * Update a deliverable's name, description, or tags
     *
     * Note: When providing tags, all existing tags are replaced.
     *
     * @param string $id Deliverable UUID
     * @param array<string, mixed> $request Optional 'name', 'description', 'tags' fields
     * @return array<string, mixed> Contains 'message' and 'deliverableId'
     *
     * @example
     * ```php
     * Deliverable::updateDeliverableInfo('uuid', [
     *     'name' => 'Updated Name',
     *     'tags' => ['finalized'],
     * ]);
     * ```
     */
    public static function updateDeliverableInfo(string $id, array $request): array
    {
        $client = self::getClient();
        return $client->patch("/v1/deliverable/{$id}", $request);
    }

    /**
     * Soft-delete a deliverable
     *
     * @param string $id Deliverable UUID
     * @return array<string, mixed> Contains 'message' and 'deliverableId'
     */
    public static function deleteDeliverable(string $id): array
    {
        $client = self::getClient();
        return $client->delete("/v1/deliverable/{$id}");
    }

    // ============================================
    // FILE DOWNLOADS
    // ============================================

    /**
     * Download the original source file (DOCX or PPTX) of a deliverable
     *
     * @param string $deliverableId Deliverable UUID
     * @return string Raw file content as bytes
     *
     * @example
     * ```php
     * $content = Deliverable::downloadSourceFile('uuid');
     * file_put_contents('contract.docx', $content);
     * ```
     */
    public static function downloadSourceFile(string $deliverableId): string
    {
        $client = self::getClient();
        return $client->getRaw("/v1/deliverable/file/{$deliverableId}");
    }

    /**
     * Download the PDF version of a deliverable
     *
     * @param string $deliverableId Deliverable UUID
     * @return string Raw PDF content as bytes
     *
     * @example
     * ```php
     * $content = Deliverable::downloadPDF('uuid');
     * file_put_contents('contract.pdf', $content);
     * ```
     */
    public static function downloadPDF(string $deliverableId): string
    {
        $client = self::getClient();
        return $client->getRaw("/v1/deliverable/file/pdf/{$deliverableId}");
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Build query parameters for list endpoints
     *
     * @param array<string, mixed> $options
     * @return array<string, mixed>
     */
    private static function buildListParams(array $options): array
    {
        $params = [];
        if (isset($options['limit'])) {
            $params['limit'] = $options['limit'];
        }
        if (isset($options['offset'])) {
            $params['offset'] = $options['offset'];
        }
        if (isset($options['query'])) {
            $params['query'] = $options['query'];
        }
        if (isset($options['showTags'])) {
            $params['showTags'] = $options['showTags'] ? 'true' : 'false';
        }
        if (isset($options['selectedTags'])) {
            $params['selectedTags'] = is_array($options['selectedTags'])
                ? $options['selectedTags']
                : [$options['selectedTags']];
        }
        if (isset($options['column0'])) {
            $params['column0'] = $options['column0'];
        }
        if (isset($options['order0'])) {
            $params['order0'] = $options['order0'];
        }
        return $params;
    }
}
