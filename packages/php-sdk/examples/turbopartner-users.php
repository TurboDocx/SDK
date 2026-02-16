<?php

/**
 * TurboPartner Example: User Management
 *
 * This example demonstrates all user management operations for both
 * organizations and the partner portal:
 *
 * Organization Users:
 * - addUserToOrganization()
 * - listOrganizationUsers()
 * - updateOrganizationUserRole()
 * - resendOrganizationInvitationToUser()
 * - removeUserFromOrganization()
 *
 * Partner Portal Users:
 * - addUserToPartnerPortal()
 * - listPartnerPortalUsers()
 * - updatePartnerUserPermissions()
 * - resendPartnerPortalInvitationToUser()
 * - removeUserFromPartnerPortal()
 *
 * Run: php examples/turbopartner-users.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboPartner;
use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\Types\Enums\OrgUserRole;
use TurboDocx\Types\Partner\PartnerPermissions;
use TurboDocx\Types\Requests\Partner\CreateOrganizationRequest;
use TurboDocx\Types\Requests\Partner\AddOrgUserRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrgUserRequest;
use TurboDocx\Types\Requests\Partner\ListOrgUsersRequest;
use TurboDocx\Types\Requests\Partner\AddPartnerUserRequest;
use TurboDocx\Types\Requests\Partner\UpdatePartnerUserRequest;
use TurboDocx\Types\Requests\Partner\ListPartnerUsersRequest;
use TurboDocx\Exceptions\TurboDocxException;

function userManagementExample(): void
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
            new CreateOrganizationRequest(name: 'User Test Organization')
        );
        $organizationId = $orgResult->data->id;
        echo "Organization created: {$organizationId}\n\n";

        // =============================================
        // ORGANIZATION USER MANAGEMENT
        // =============================================

        echo "=== ORGANIZATION USER MANAGEMENT ===\n\n";

        // 1. ADD USER TO ORGANIZATION
        echo "1. Adding user to organization...\n";

        $addOrgUserResult = TurboPartner::addUserToOrganization(
            $organizationId,
            new AddOrgUserRequest(
                email: 'john.doe@example.com',
                role: OrgUserRole::ADMIN
            )
        );

        echo "User added to organization!\n";
        echo "  User ID: {$addOrgUserResult->data->id}\n";
        echo "  Email: {$addOrgUserResult->data->email}\n";
        echo "  Role: {$addOrgUserResult->data->role}\n\n";

        $orgUserId = $addOrgUserResult->data->id;

        // 2. LIST ORGANIZATION USERS
        echo "2. Listing organization users...\n";

        $listOrgUsersResult = TurboPartner::listOrganizationUsers(
            $organizationId,
            new ListOrgUsersRequest(
                limit: 50,
                offset: 0
            )
        );

        echo "Found {$listOrgUsersResult->totalRecords} user(s)\n";
        echo "User Limit: {$listOrgUsersResult->userLimit}\n";
        foreach ($listOrgUsersResult->results as $user) {
            echo "  - {$user->email} ({$user->role})\n";
        }
        echo "\n";

        // 3. UPDATE ORGANIZATION USER ROLE
        echo "3. Updating organization user role...\n";

        $updateOrgUserResult = TurboPartner::updateOrganizationUserRole(
            $organizationId,
            $orgUserId,
            new UpdateOrgUserRequest(role: OrgUserRole::CONTRIBUTOR)
        );

        echo "User role updated!\n";
        echo "  User ID: {$updateOrgUserResult->data->id}\n";
        echo "  New Role: {$updateOrgUserResult->data->role}\n\n";

        // 4. RESEND ORGANIZATION INVITATION
        echo "4. Resending organization invitation...\n";

        $resendOrgResult = TurboPartner::resendOrganizationInvitationToUser(
            $organizationId,
            $orgUserId
        );

        echo "Invitation resent!\n";
        echo "  Success: " . ($resendOrgResult->success ? 'true' : 'false') . "\n";
        if ($resendOrgResult->message !== null) {
            echo "  Message: {$resendOrgResult->message}\n";
        }
        echo "\n";

        // 5. REMOVE USER FROM ORGANIZATION
        echo "5. Removing user from organization...\n";

        $removeOrgUserResult = TurboPartner::removeUserFromOrganization(
            $organizationId,
            $orgUserId
        );

        echo "User removed from organization!\n";
        echo "  Success: " . ($removeOrgUserResult->success ? 'true' : 'false') . "\n\n";

        // =============================================
        // PARTNER PORTAL USER MANAGEMENT
        // =============================================

        echo "=== PARTNER PORTAL USER MANAGEMENT ===\n\n";

        // 6. ADD USER TO PARTNER PORTAL
        echo "6. Adding user to partner portal...\n";

        $addPartnerUserResult = TurboPartner::addUserToPartnerPortal(
            new AddPartnerUserRequest(
                email: 'jane.smith@example.com',
                role: 'member',
                permissions: new PartnerPermissions(
                    canManageOrgs: true,
                    canManageOrgUsers: true,
                    canManagePartnerUsers: false,
                    canManageOrgAPIKeys: false,
                    canManagePartnerAPIKeys: false,
                    canUpdateEntitlements: true,
                    canViewAuditLogs: true
                )
            )
        );

        echo "User added to partner portal!\n";
        echo "  User ID: {$addPartnerUserResult->data->id}\n";
        echo "  Email: {$addPartnerUserResult->data->email}\n";
        echo "  Role: {$addPartnerUserResult->data->role}\n";
        if ($addPartnerUserResult->data->permissions !== null) {
            echo "  Can Manage Orgs: " . ($addPartnerUserResult->data->permissions->canManageOrgs ? 'Yes' : 'No') . "\n";
        }
        echo "\n";

        $partnerUserId = $addPartnerUserResult->data->id;

        // 7. LIST PARTNER PORTAL USERS
        echo "7. Listing partner portal users...\n";

        $listPartnerUsersResult = TurboPartner::listPartnerPortalUsers(
            new ListPartnerUsersRequest(
                limit: 50,
                offset: 0
            )
        );

        echo "Found {$listPartnerUsersResult->totalRecords} partner user(s)\n";
        foreach ($listPartnerUsersResult->results as $user) {
            echo "  - {$user->email} ({$user->role})\n";
        }
        echo "\n";

        // 8. UPDATE PARTNER USER PERMISSIONS
        echo "8. Updating partner user permissions...\n";

        $updatePartnerUserResult = TurboPartner::updatePartnerUserPermissions(
            $partnerUserId,
            new UpdatePartnerUserRequest(
                role: 'admin',
                permissions: new PartnerPermissions(
                    canManageOrgs: true,
                    canManageOrgUsers: true,
                    canManagePartnerUsers: true,
                    canManageOrgAPIKeys: true,
                    canManagePartnerAPIKeys: true,
                    canUpdateEntitlements: true,
                    canViewAuditLogs: true
                )
            )
        );

        echo "Partner user permissions updated!\n";
        echo "  User ID: {$updatePartnerUserResult->data->id}\n";
        echo "  New Role: {$updatePartnerUserResult->data->role}\n\n";

        // 9. RESEND PARTNER PORTAL INVITATION
        echo "9. Resending partner portal invitation...\n";

        $resendPartnerResult = TurboPartner::resendPartnerPortalInvitationToUser($partnerUserId);

        echo "Partner invitation resent!\n";
        echo "  Success: " . ($resendPartnerResult->success ? 'true' : 'false') . "\n\n";

        // 10. REMOVE USER FROM PARTNER PORTAL
        echo "10. Removing user from partner portal...\n";

        $removePartnerUserResult = TurboPartner::removeUserFromPartnerPortal($partnerUserId);

        echo "User removed from partner portal!\n";
        echo "  Success: " . ($removePartnerUserResult->success ? 'true' : 'false') . "\n\n";

        // Cleanup: Delete the test organization
        echo "Cleaning up: Deleting test organization...\n";
        TurboPartner::deleteOrganization($organizationId);
        echo "Test organization deleted.\n";

        echo "\n=== All user management operations completed successfully! ===\n";

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
userManagementExample();
