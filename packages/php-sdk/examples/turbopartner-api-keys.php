<?php

/**
 * TurboPartner Example: API Key Management & Audit Logs
 *
 * This example demonstrates all API key management operations and audit logs:
 *
 * Organization API Keys:
 * - createOrganizationApiKey()
 * - listOrganizationApiKeys()
 * - updateOrganizationApiKey()
 * - revokeOrganizationApiKey()
 *
 * Partner API Keys:
 * - createPartnerApiKey()
 * - listPartnerApiKeys()
 * - updatePartnerApiKey()
 * - revokePartnerApiKey()
 *
 * Audit Logs:
 * - getPartnerAuditLogs()
 *
 * Run: php examples/turbopartner-api-keys.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboPartner;
use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\Types\Enums\PartnerScope;
use TurboDocx\Types\Requests\Partner\CreateOrganizationRequest;
use TurboDocx\Types\Requests\Partner\CreateOrgApiKeyRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrgApiKeyRequest;
use TurboDocx\Types\Requests\Partner\ListOrgApiKeysRequest;
use TurboDocx\Types\Requests\Partner\CreatePartnerApiKeyRequest;
use TurboDocx\Types\Requests\Partner\UpdatePartnerApiKeyRequest;
use TurboDocx\Types\Requests\Partner\ListPartnerApiKeysRequest;
use TurboDocx\Types\Requests\Partner\ListAuditLogsRequest;
use TurboDocx\Exceptions\TurboDocxException;

function apiKeyManagementExample(): void
{
    // Configure the TurboPartner client
    TurboPartner::configure(new PartnerClientConfig(
        partnerApiKey: getenv('TURBODOCX_PARTNER_API_KEY') ?: 'your-partner-api-key-here',
        partnerId: getenv('TURBODOCX_PARTNER_ID') ?: 'your-partner-id-here',
        baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com'
    ));

    try {
        // First, create an organization to work with
        echo "Creating test organization...\n";
        $orgResult = TurboPartner::createOrganization(
            new CreateOrganizationRequest(name: 'API Key Test Organization')
        );
        $organizationId = $orgResult->data->id;
        echo "Organization created: {$organizationId}\n\n";

        // =============================================
        // ORGANIZATION API KEY MANAGEMENT
        // =============================================

        echo "=== ORGANIZATION API KEY MANAGEMENT ===\n\n";

        // 1. CREATE ORGANIZATION API KEY
        echo "1. Creating organization API key...\n";

        $createOrgKeyResult = TurboPartner::createOrganizationApiKey(
            $organizationId,
            new CreateOrgApiKeyRequest(
                name: 'Production API Key',
                role: 'admin'
            )
        );

        echo "Organization API key created!\n";
        echo "  Key ID: {$createOrgKeyResult->data->id}\n";
        echo "  Name: {$createOrgKeyResult->data->name}\n";
        echo "  Role: {$createOrgKeyResult->data->role}\n";
        if ($createOrgKeyResult->data->key !== null) {
            echo "  Full Key (SAVE THIS!): {$createOrgKeyResult->data->key}\n";
        }
        echo "\n";

        $orgApiKeyId = $createOrgKeyResult->data->id;

        // 2. LIST ORGANIZATION API KEYS
        echo "2. Listing organization API keys...\n";

        $listOrgKeysResult = TurboPartner::listOrganizationApiKeys(
            $organizationId,
            new ListOrgApiKeysRequest(
                limit: 50,
                offset: 0
            )
        );

        echo "Found {$listOrgKeysResult->totalRecords} API key(s)\n";
        foreach ($listOrgKeysResult->results as $key) {
            echo "  - {$key->name} (ID: {$key->id}, Role: {$key->role})\n";
        }
        echo "\n";

        // 3. UPDATE ORGANIZATION API KEY
        echo "3. Updating organization API key...\n";

        $updateOrgKeyResult = TurboPartner::updateOrganizationApiKey(
            $organizationId,
            $orgApiKeyId,
            new UpdateOrgApiKeyRequest(
                name: 'Production API Key (Updated)',
                role: 'contributor'
            )
        );

        echo "Organization API key updated!\n";
        echo "  Key ID: {$updateOrgKeyResult->data->id}\n";
        echo "  New Name: {$updateOrgKeyResult->data->name}\n";
        echo "  New Role: {$updateOrgKeyResult->data->role}\n";
        echo "\n";

        // 4. REVOKE ORGANIZATION API KEY
        echo "4. Revoking organization API key...\n";

        $revokeOrgKeyResult = TurboPartner::revokeOrganizationApiKey(
            $organizationId,
            $orgApiKeyId
        );

        echo "Organization API key revoked!\n";
        echo "  Success: " . ($revokeOrgKeyResult->success ? 'true' : 'false') . "\n\n";

        // =============================================
        // PARTNER API KEY MANAGEMENT
        // =============================================

        echo "=== PARTNER API KEY MANAGEMENT ===\n\n";

        // 5. CREATE PARTNER API KEY
        echo "5. Creating partner API key...\n";

        $createPartnerKeyResult = TurboPartner::createPartnerApiKey(
            new CreatePartnerApiKeyRequest(
                name: 'Integration Partner Key',
                scopes: [
                    PartnerScope::ORG_CREATE,
                    PartnerScope::ORG_READ,
                    PartnerScope::ORG_UPDATE,
                    PartnerScope::ORG_DELETE,
                    PartnerScope::ENTITLEMENTS_UPDATE,
                    PartnerScope::AUDIT_READ,
                ],
                description: 'API key for third-party integration'
            )
        );

        echo "Partner API key created!\n";
        echo "  Key ID: {$createPartnerKeyResult->data->id}\n";
        echo "  Name: {$createPartnerKeyResult->data->name}\n";
        if ($createPartnerKeyResult->data->key !== null) {
            echo "  Full Key (SAVE THIS!): {$createPartnerKeyResult->data->key}\n";
        }
        if ($createPartnerKeyResult->data->scopes !== null) {
            echo "  Scopes: " . implode(', ', $createPartnerKeyResult->data->scopes) . "\n";
        }
        echo "\n";

        $partnerApiKeyId = $createPartnerKeyResult->data->id;

        // 6. LIST PARTNER API KEYS
        echo "6. Listing partner API keys...\n";

        $listPartnerKeysResult = TurboPartner::listPartnerApiKeys(
            new ListPartnerApiKeysRequest(
                limit: 50,
                offset: 0
            )
        );

        echo "Found {$listPartnerKeysResult->totalRecords} partner API key(s)\n";
        foreach ($listPartnerKeysResult->results as $key) {
            // Listed keys show a masked preview (e.g. "TDXP-a1b2...5e6f"), never the full key
            echo "  - {$key->name} (ID: {$key->id}, Key: {$key->key})\n";
        }
        echo "\n";

        // 7. UPDATE PARTNER API KEY
        echo "7. Updating partner API key...\n";

        $updatePartnerKeyResult = TurboPartner::updatePartnerApiKey(
            $partnerApiKeyId,
            new UpdatePartnerApiKeyRequest(
                name: 'Integration Partner Key (Updated)',
                description: 'Updated description for the integration key'
            )
        );

        echo "Partner API key updated!\n";
        echo "  Key ID: {$updatePartnerKeyResult->data->id}\n";
        echo "  New Name: {$updatePartnerKeyResult->data->name}\n";
        echo "\n";

        // 8. REVOKE PARTNER API KEY
        echo "8. Revoking partner API key...\n";

        $revokePartnerKeyResult = TurboPartner::revokePartnerApiKey($partnerApiKeyId);

        echo "Partner API key revoked!\n";
        echo "  Success: " . ($revokePartnerKeyResult->success ? 'true' : 'false') . "\n\n";

        // =============================================
        // AUDIT LOGS
        // =============================================

        echo "=== AUDIT LOGS ===\n\n";

        // 9. GET PARTNER AUDIT LOGS
        echo "9. Getting partner audit logs...\n";

        $auditLogsResult = TurboPartner::getPartnerAuditLogs(
            new ListAuditLogsRequest(
                limit: 20,
                offset: 0
                // Optional filters:
                // action: 'ORG_CREATED',
                // actorId: 'user-uuid-here',
                // startDate: '2024-01-01',
                // endDate: '2024-12-31'
            )
        );

        echo "Found {$auditLogsResult->totalRecords} audit log entries\n";
        echo "Showing first {$auditLogsResult->limit} entries:\n\n";

        foreach ($auditLogsResult->results as $entry) {
            echo "  Action: {$entry->action}\n";
            if ($entry->resourceType !== null) {
                echo "    Resource: {$entry->resourceType}";
                if ($entry->resourceId !== null) {
                    echo " (ID: {$entry->resourceId})";
                }
                echo "\n";
            }
            if ($entry->createdOn !== null) {
                echo "    Time: {$entry->createdOn}\n";
            }
            echo "\n";
        }

        // Cleanup: Delete the test organization
        echo "Cleaning up: Deleting test organization...\n";
        TurboPartner::deleteOrganization($organizationId);
        echo "Test organization deleted.\n";

        echo "\n=== All API key and audit log operations completed successfully! ===\n";

    } catch (TurboDocxException $e) {
        echo "Error: {$e->getMessage()}\n";
        if ($e->statusCode !== null) {
            echo "Status Code: {$e->statusCode}\n";
        }
        if ($e->errorCode !== null) {
            echo "Error Code: {$e->errorCode}\n";
        }
    }
}

// Run the example
apiKeyManagementExample();
