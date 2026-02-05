<?php

/**
 * TurboPartner PHP SDK - Manual Test Suite
 *
 * Run: php manual_test_partner.php
 *
 * Make sure to configure the values below before running.
 */

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use TurboDocx\TurboPartner;
use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\Types\Enums\OrgUserRole;
use TurboDocx\Types\Enums\PartnerScope;
use TurboDocx\Types\Partner\PartnerPermissions;
use TurboDocx\Types\Requests\Partner\CreateOrganizationRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrganizationRequest;
use TurboDocx\Types\Requests\Partner\UpdateEntitlementsRequest;
use TurboDocx\Types\Requests\Partner\ListOrganizationsRequest;
use TurboDocx\Types\Requests\Partner\AddOrgUserRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrgUserRequest;
use TurboDocx\Types\Requests\Partner\ListOrgUsersRequest;
use TurboDocx\Types\Requests\Partner\CreateOrgApiKeyRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrgApiKeyRequest;
use TurboDocx\Types\Requests\Partner\ListOrgApiKeysRequest;
use TurboDocx\Types\Requests\Partner\CreatePartnerApiKeyRequest;
use TurboDocx\Types\Requests\Partner\UpdatePartnerApiKeyRequest;
use TurboDocx\Types\Requests\Partner\ListPartnerApiKeysRequest;
use TurboDocx\Types\Requests\Partner\AddPartnerUserRequest;
use TurboDocx\Types\Requests\Partner\UpdatePartnerUserRequest;
use TurboDocx\Types\Requests\Partner\ListPartnerUsersRequest;
use TurboDocx\Types\Requests\Partner\ListAuditLogsRequest;
use TurboDocx\Exceptions\TurboDocxException;

// =============================================
// CONFIGURE THESE VALUES BEFORE RUNNING
// =============================================
const PARTNER_API_KEY = 'your-partner-api-key-here';     // Replace with your Partner API key
const BASE_URL = 'https://api.turbodocx.com';            // Replace with your API URL
const PARTNER_ID = 'your-partner-id-here';               // Replace with your Partner UUID

const TEST_EMAIL = 'test@example.com';                   // Replace with a real email for user tests

// =============================================
// TEST IDs - Replace with IDs from your test runs
// =============================================
const TEST_ORG_ID = 'your-organization-id-here';         // Use ID from createOrganization()
const TEST_USER_ID = 'your-user-id-here';                // Use ID from addUserToOrganization()
const TEST_API_KEY_ID = 'your-api-key-id-here';          // Use ID from createOrganizationApiKey()
const TEST_PARTNER_KEY_ID = 'your-partner-key-id-here';  // Use ID from createPartnerApiKey()
const TEST_PARTNER_USER_ID = 'your-partner-user-id-here';// Use ID from addUserToPartnerPortal()

// Initialize client
TurboPartner::configure(new PartnerClientConfig(
    partnerApiKey: PARTNER_API_KEY,
    partnerId: PARTNER_ID,
    baseUrl: BASE_URL,
));

// =============================================
// ORGANIZATION MANAGEMENT TESTS
// =============================================

/**
 * Test 1: Create organization
 */
function testCreateOrganization(): string
{
    echo "\n--- Test 1: createOrganization ---\n";

    $result = TurboPartner::createOrganization(
        new CreateOrganizationRequest(name: 'SDK Test Organization')
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    echo "Organization ID: " . $result->data->id . "\n";
    return $result->data->id;
}

/**
 * Test 2: List organizations
 */
function testListOrganizations(): void
{
    echo "\n--- Test 2: listOrganizations ---\n";

    $result = TurboPartner::listOrganizations(
        new ListOrganizationsRequest(limit: 10, offset: 0, search: 'SDK Test')
    );

    echo "Total Records: " . $result->totalRecords . "\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 3: Get organization details
 */
function testGetOrganizationDetails(string $organizationId): void
{
    echo "\n--- Test 3: getOrganizationDetails ---\n";

    $result = TurboPartner::getOrganizationDetails($organizationId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 4: Update organization info
 */
function testUpdateOrganizationInfo(string $organizationId): void
{
    echo "\n--- Test 4: updateOrganizationInfo ---\n";

    $result = TurboPartner::updateOrganizationInfo(
        $organizationId,
        new UpdateOrganizationRequest(name: 'SDK Test Organization (Updated)')
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 5: Update organization entitlements
 */
function testUpdateOrganizationEntitlements(string $organizationId): void
{
    echo "\n--- Test 5: updateOrganizationEntitlements ---\n";

    $result = TurboPartner::updateOrganizationEntitlements(
        $organizationId,
        new UpdateEntitlementsRequest(
            features: [
                'maxUsers' => 25,
                'maxStorage' => 5368709120, // 5GB
                'hasTDAI' => true,
            ]
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 6: Delete organization (run last for org tests)
 */
function testDeleteOrganization(string $organizationId): void
{
    echo "\n--- Test 6: deleteOrganization ---\n";

    $result = TurboPartner::deleteOrganization($organizationId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

// =============================================
// ORGANIZATION USER MANAGEMENT TESTS
// =============================================

/**
 * Test 7: Add user to organization
 */
function testAddUserToOrganization(string $organizationId): string
{
    echo "\n--- Test 7: addUserToOrganization ---\n";

    $result = TurboPartner::addUserToOrganization(
        $organizationId,
        new AddOrgUserRequest(
            email: TEST_EMAIL,
            role: OrgUserRole::ADMIN
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    echo "User ID: " . $result->data->id . "\n";
    return $result->data->id;
}

/**
 * Test 8: List organization users
 */
function testListOrganizationUsers(string $organizationId): void
{
    echo "\n--- Test 8: listOrganizationUsers ---\n";

    $result = TurboPartner::listOrganizationUsers(
        $organizationId,
        new ListOrgUsersRequest(limit: 50)
    );

    echo "Total Records: " . $result->totalRecords . "\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 9: Update organization user role
 */
function testUpdateOrganizationUserRole(string $organizationId, string $userId): void
{
    echo "\n--- Test 9: updateOrganizationUserRole ---\n";

    $result = TurboPartner::updateOrganizationUserRole(
        $organizationId,
        $userId,
        new UpdateOrgUserRequest(role: OrgUserRole::CONTRIBUTOR)
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 10: Resend organization invitation to user
 */
function testResendOrganizationInvitationToUser(string $organizationId, string $userId): void
{
    echo "\n--- Test 10: resendOrganizationInvitationToUser ---\n";

    $result = TurboPartner::resendOrganizationInvitationToUser($organizationId, $userId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 11: Remove user from organization
 */
function testRemoveUserFromOrganization(string $organizationId, string $userId): void
{
    echo "\n--- Test 11: removeUserFromOrganization ---\n";

    $result = TurboPartner::removeUserFromOrganization($organizationId, $userId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

// =============================================
// ORGANIZATION API KEY MANAGEMENT TESTS
// =============================================

/**
 * Test 12: Create organization API key
 */
function testCreateOrganizationApiKey(string $organizationId): string
{
    echo "\n--- Test 12: createOrganizationApiKey ---\n";

    $result = TurboPartner::createOrganizationApiKey(
        $organizationId,
        new CreateOrgApiKeyRequest(
            name: 'SDK Test API Key',
            role: 'admin'
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    echo "API Key ID: " . $result->data->id . "\n";
    return $result->data->id;
}

/**
 * Test 13: List organization API keys
 */
function testListOrganizationApiKeys(string $organizationId): void
{
    echo "\n--- Test 13: listOrganizationApiKeys ---\n";

    $result = TurboPartner::listOrganizationApiKeys(
        $organizationId,
        new ListOrgApiKeysRequest(limit: 50)
    );

    echo "Total Records: " . $result->totalRecords . "\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 14: Update organization API key
 */
function testUpdateOrganizationApiKey(string $organizationId, string $apiKeyId): void
{
    echo "\n--- Test 14: updateOrganizationApiKey ---\n";

    $result = TurboPartner::updateOrganizationApiKey(
        $organizationId,
        $apiKeyId,
        new UpdateOrgApiKeyRequest(name: 'SDK Test API Key (Updated)')
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 15: Revoke organization API key
 */
function testRevokeOrganizationApiKey(string $organizationId, string $apiKeyId): void
{
    echo "\n--- Test 15: revokeOrganizationApiKey ---\n";

    $result = TurboPartner::revokeOrganizationApiKey($organizationId, $apiKeyId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

// =============================================
// PARTNER API KEY MANAGEMENT TESTS
// =============================================

/**
 * Test 16: Create partner API key
 */
function testCreatePartnerApiKey(): string
{
    echo "\n--- Test 16: createPartnerApiKey ---\n";

    $result = TurboPartner::createPartnerApiKey(
        new CreatePartnerApiKeyRequest(
            name: 'SDK Test Partner Key',
            scopes: [
                PartnerScope::ORG_CREATE,
                PartnerScope::ORG_READ,
                PartnerScope::ENTITLEMENTS_UPDATE,
            ],
            description: 'Created by manual test script',
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    echo "Partner API Key ID: " . $result->data->id . "\n";
    if ($result->data->key !== null) {
        echo "Full Key (save this!): " . $result->data->key . "\n";
    }
    return $result->data->id;
}

/**
 * Test 17: List partner API keys
 */
function testListPartnerApiKeys(): void
{
    echo "\n--- Test 17: listPartnerApiKeys ---\n";

    $result = TurboPartner::listPartnerApiKeys(
        new ListPartnerApiKeysRequest(limit: 50)
    );

    echo "Total Records: " . $result->totalRecords . "\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 18: Update partner API key
 */
function testUpdatePartnerApiKey(string $keyId): void
{
    echo "\n--- Test 18: updatePartnerApiKey ---\n";

    $result = TurboPartner::updatePartnerApiKey(
        $keyId,
        new UpdatePartnerApiKeyRequest(
            name: 'SDK Test Partner Key (Updated)',
            description: 'Updated by manual test script',
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 19: Revoke partner API key
 */
function testRevokePartnerApiKey(string $keyId): void
{
    echo "\n--- Test 19: revokePartnerApiKey ---\n";

    $result = TurboPartner::revokePartnerApiKey($keyId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

// =============================================
// PARTNER USER MANAGEMENT TESTS
// =============================================

/**
 * Test 20: Add user to partner portal
 */
function testAddUserToPartnerPortal(): string
{
    echo "\n--- Test 20: addUserToPartnerPortal ---\n";

    $result = TurboPartner::addUserToPartnerPortal(
        new AddPartnerUserRequest(
            email: TEST_EMAIL,
            role: 'member',
            permissions: new PartnerPermissions(
                canManageOrgs: true,
                canManageOrgUsers: true,
                canManagePartnerUsers: false,
                canManageOrgAPIKeys: false,
                canManagePartnerAPIKeys: false,
                canUpdateEntitlements: true,
                canViewAuditLogs: true,
            )
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    echo "Partner User ID: " . $result->data->id . "\n";
    return $result->data->id;
}

/**
 * Test 21: List partner portal users
 */
function testListPartnerPortalUsers(): void
{
    echo "\n--- Test 21: listPartnerPortalUsers ---\n";

    $result = TurboPartner::listPartnerPortalUsers(
        new ListPartnerUsersRequest(limit: 50)
    );

    echo "Total Records: " . $result->totalRecords . "\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 22: Update partner user permissions
 */
function testUpdatePartnerUserPermissions(string $userId): void
{
    echo "\n--- Test 22: updatePartnerUserPermissions ---\n";

    $result = TurboPartner::updatePartnerUserPermissions(
        $userId,
        new UpdatePartnerUserRequest(
            role: 'admin',
            permissions: new PartnerPermissions(
                canManageOrgs: true,
                canManageOrgUsers: true,
                canManagePartnerUsers: true,
                canManageOrgAPIKeys: true,
                canManagePartnerAPIKeys: true,
                canUpdateEntitlements: true,
                canViewAuditLogs: true,
            )
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 23: Resend partner portal invitation to user
 */
function testResendPartnerPortalInvitationToUser(string $userId): void
{
    echo "\n--- Test 23: resendPartnerPortalInvitationToUser ---\n";

    $result = TurboPartner::resendPartnerPortalInvitationToUser($userId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 24: Remove user from partner portal
 */
function testRemoveUserFromPartnerPortal(string $userId): void
{
    echo "\n--- Test 24: removeUserFromPartnerPortal ---\n";

    $result = TurboPartner::removeUserFromPartnerPortal($userId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

// =============================================
// AUDIT LOG TESTS
// =============================================

/**
 * Test 25: Get partner audit logs
 */
function testGetPartnerAuditLogs(): void
{
    echo "\n--- Test 25: getPartnerAuditLogs ---\n";

    $result = TurboPartner::getPartnerAuditLogs(
        new ListAuditLogsRequest(
            limit: 20,
            offset: 0,
        )
    );

    echo "Total Records: " . $result->totalRecords . "\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

// =============================================
// MAIN TEST RUNNER
// =============================================

function main(): void
{
    echo "==============================================\n";
    echo "TurboPartner PHP SDK - Manual Test Suite\n";
    echo "==============================================\n";

    try {
        // Uncomment and run tests as needed:
        // Use IDs returned from creation functions, or set the TEST_* constants above

        // --- Organization Management ---
        // $orgId = testCreateOrganization();
        // testListOrganizations();
        // testGetOrganizationDetails(TEST_ORG_ID);
        // testUpdateOrganizationInfo(TEST_ORG_ID);
        // testUpdateOrganizationEntitlements(TEST_ORG_ID);
        // testDeleteOrganization(TEST_ORG_ID);  // Run last for org tests

        // --- Organization User Management ---
        // $orgUserId = testAddUserToOrganization(TEST_ORG_ID);
        // testListOrganizationUsers(TEST_ORG_ID);
        // testUpdateOrganizationUserRole(TEST_ORG_ID, TEST_USER_ID);
        // testResendOrganizationInvitationToUser(TEST_ORG_ID, TEST_USER_ID);
        // testRemoveUserFromOrganization(TEST_ORG_ID, TEST_USER_ID);

        // --- Organization API Key Management ---
        // $orgApiKeyId = testCreateOrganizationApiKey(TEST_ORG_ID);
        // testListOrganizationApiKeys(TEST_ORG_ID);
        // testUpdateOrganizationApiKey(TEST_ORG_ID, TEST_API_KEY_ID);
        // testRevokeOrganizationApiKey(TEST_ORG_ID, TEST_API_KEY_ID);

        // --- Partner API Key Management ---
        // $partnerKeyId = testCreatePartnerApiKey();
        // testListPartnerApiKeys();
        // testUpdatePartnerApiKey(TEST_PARTNER_KEY_ID);
        // testRevokePartnerApiKey(TEST_PARTNER_KEY_ID);

        // --- Partner User Management ---
        // $partnerUserId = testAddUserToPartnerPortal();
        // testListPartnerPortalUsers();
        // testUpdatePartnerUserPermissions(TEST_PARTNER_USER_ID);
        // testResendPartnerPortalInvitationToUser(TEST_PARTNER_USER_ID);
        // testRemoveUserFromPartnerPortal(TEST_PARTNER_USER_ID);

        // --- Audit Logs ---
        // testGetPartnerAuditLogs();

        echo "\n==============================================\n";
        echo "All tests completed successfully!\n";
        echo "==============================================\n";

    } catch (TurboDocxException $e) {
        echo "\n==============================================\n";
        echo "TEST FAILED\n";
        echo "==============================================\n";
        echo "Error: " . $e->getMessage() . "\n";
        if ($e->statusCode !== null) {
            echo "Status Code: " . $e->statusCode . "\n";
        }
        if ($e->errorCode !== null) {
            echo "Error Code: " . $e->errorCode . "\n";
        }
        exit(1);
    } catch (\Exception $e) {
        echo "\n==============================================\n";
        echo "TEST FAILED\n";
        echo "==============================================\n";
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}

// Run the tests
main();
