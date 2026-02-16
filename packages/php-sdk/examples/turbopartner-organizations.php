<?php

/**
 * TurboPartner Example: Organization Management
 *
 * This example demonstrates all organization lifecycle operations:
 * - createOrganization()
 * - listOrganizations()
 * - getOrganizationDetails()
 * - updateOrganizationInfo()
 * - updateOrganizationEntitlements()
 * - deleteOrganization()
 *
 * Run: php examples/turbopartner-organizations.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboPartner;
use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\Types\Requests\Partner\CreateOrganizationRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrganizationRequest;
use TurboDocx\Types\Requests\Partner\UpdateEntitlementsRequest;
use TurboDocx\Types\Requests\Partner\ListOrganizationsRequest;
use TurboDocx\Exceptions\TurboDocxException;

function organizationManagementExample(): void
{
    // Configure the TurboPartner client
    TurboPartner::configure(new PartnerClientConfig(
        partnerApiKey: getenv('TURBODOCX_PARTNER_API_KEY') ?: 'your-partner-api-key-here',
        partnerId: getenv('TURBODOCX_PARTNER_ID') ?: 'your-partner-id-here',
        baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com'
    ));

    try {
        // =============================================
        // 1. CREATE ORGANIZATION
        // =============================================
        echo "1. Creating organization...\n";

        $createResult = TurboPartner::createOrganization(
            new CreateOrganizationRequest(name: 'Acme Corporation')
        );

        echo "Organization created!\n";
        echo "  ID: {$createResult->data->id}\n";
        echo "  Name: {$createResult->data->name}\n";
        echo "  Partner ID: {$createResult->data->partnerId}\n\n";

        $organizationId = $createResult->data->id;

        // =============================================
        // 2. LIST ORGANIZATIONS
        // =============================================
        echo "2. Listing organizations...\n";

        $listResult = TurboPartner::listOrganizations(
            new ListOrganizationsRequest(
                limit: 10,
                offset: 0,
                search: 'Acme'  // Optional search filter
            )
        );

        echo "Found {$listResult->totalRecords} organization(s)\n";
        foreach ($listResult->results as $org) {
            echo "  - {$org->name} (ID: {$org->id})\n";
        }
        echo "\n";

        // =============================================
        // 3. GET ORGANIZATION DETAILS
        // =============================================
        echo "3. Getting organization details...\n";

        $detailResult = TurboPartner::getOrganizationDetails($organizationId);

        echo "Organization Details:\n";
        echo "  ID: {$detailResult->organization->id}\n";
        echo "  Name: {$detailResult->organization->name}\n";
        if ($detailResult->features !== null) {
            echo "  Max Users: {$detailResult->features->maxUsers}\n";
            echo "  Max Storage: {$detailResult->features->maxStorage} bytes\n";
        }
        echo "\n";

        // =============================================
        // 4. UPDATE ORGANIZATION INFO
        // =============================================
        echo "4. Updating organization info...\n";

        $updateResult = TurboPartner::updateOrganizationInfo(
            $organizationId,
            new UpdateOrganizationRequest(name: 'Acme Corporation (Updated)')
        );

        echo "Organization updated!\n";
        echo "  New Name: {$updateResult->data->name}\n\n";

        // =============================================
        // 5. UPDATE ORGANIZATION ENTITLEMENTS
        // =============================================
        echo "5. Updating organization entitlements...\n";

        $entitlementsResult = TurboPartner::updateOrganizationEntitlements(
            $organizationId,
            new UpdateEntitlementsRequest(
                features: [
                    'maxUsers' => 50,
                    'maxStorage' => 10737418240,  // 10GB
                    'maxSignatures' => 100,
                    'hasTDAI' => true,
                    'hasFileDownload' => true,
                ]
            )
        );

        echo "Entitlements updated!\n";
        if ($entitlementsResult->features !== null) {
            echo "  Max Users: {$entitlementsResult->features->maxUsers}\n";
            echo "  Max Storage: {$entitlementsResult->features->maxStorage} bytes\n";
        }
        echo "\n";

        // =============================================
        // 6. DELETE ORGANIZATION
        // =============================================
        echo "6. Deleting organization...\n";

        $deleteResult = TurboPartner::deleteOrganization($organizationId);

        echo "Organization deleted!\n";
        echo "  Success: " . ($deleteResult->success ? 'true' : 'false') . "\n";

        echo "\n=== All organization operations completed successfully! ===\n";

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
organizationManagementExample();
