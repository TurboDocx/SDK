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
 * Run: npx tsx examples/turbopartner-users.ts
 */

import { TurboPartner } from '@turbodocx/sdk';

async function userManagementExample(): Promise<void> {
  // Configure the TurboPartner client
  TurboPartner.configure({
    partnerApiKey: process.env.TURBODOCX_PARTNER_API_KEY || 'your-partner-api-key-here',
    partnerId: process.env.TURBODOCX_PARTNER_ID || 'your-partner-id-here',
    baseUrl: process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com',
  });

  try {
    // First, create an organization to work with
    console.log('Creating test organization...');
    const orgResult = await TurboPartner.createOrganization({
      name: 'User Test Organization',
    });
    const organizationId = orgResult.data.id;
    console.log(`Organization created: ${organizationId}\n`);

    // =============================================
    // ORGANIZATION USER MANAGEMENT
    // =============================================

    console.log('=== ORGANIZATION USER MANAGEMENT ===\n');

    // 1. ADD USER TO ORGANIZATION
    console.log('1. Adding user to organization...');

    const addOrgUserResult = await TurboPartner.addUserToOrganization(organizationId, {
      email: 'john.doe@example.com',
      role: 'admin',
    });

    console.log('User added to organization!');
    console.log(`  User ID: ${addOrgUserResult.data.id}`);
    console.log(`  Email: ${addOrgUserResult.data.email}`);
    console.log(`  Role: ${addOrgUserResult.data.role}\n`);

    const orgUserId = addOrgUserResult.data.id;

    // 2. LIST ORGANIZATION USERS
    console.log('2. Listing organization users...');

    const listOrgUsersResult = await TurboPartner.listOrganizationUsers(organizationId, {
      limit: 50,
      offset: 0,
    });

    console.log(`Found ${listOrgUsersResult.data.totalRecords} user(s)`);
    if (listOrgUsersResult.userLimit) {
      console.log(`User Limit: ${listOrgUsersResult.userLimit}`);
    }
    for (const user of listOrgUsersResult.data.results) {
      console.log(`  - ${user.email} (${user.role})`);
    }
    console.log();

    // 3. UPDATE ORGANIZATION USER ROLE
    console.log('3. Updating organization user role...');

    const updateOrgUserResult = await TurboPartner.updateOrganizationUserRole(
      organizationId,
      orgUserId,
      { role: 'contributor' },
    );

    console.log('User role updated!');
    console.log(`  User ID: ${updateOrgUserResult.data.id}`);
    console.log(`  New Role: ${updateOrgUserResult.data.role}\n`);

    // 4. RESEND ORGANIZATION INVITATION
    console.log('4. Resending organization invitation...');

    const resendOrgResult = await TurboPartner.resendOrganizationInvitationToUser(
      organizationId,
      orgUserId,
    );

    console.log('Invitation resent!');
    console.log(`  Success: ${resendOrgResult.success}`);
    if (resendOrgResult.message) {
      console.log(`  Message: ${resendOrgResult.message}`);
    }
    console.log();

    // 5. REMOVE USER FROM ORGANIZATION
    console.log('5. Removing user from organization...');

    const removeOrgUserResult = await TurboPartner.removeUserFromOrganization(
      organizationId,
      orgUserId,
    );

    console.log('User removed from organization!');
    console.log(`  Success: ${removeOrgUserResult.success}\n`);

    // =============================================
    // PARTNER PORTAL USER MANAGEMENT
    // =============================================

    console.log('=== PARTNER PORTAL USER MANAGEMENT ===\n');

    // 6. ADD USER TO PARTNER PORTAL
    console.log('6. Adding user to partner portal...');

    const addPartnerUserResult = await TurboPartner.addUserToPartnerPortal({
      email: 'jane.smith@example.com',
      role: 'member',
      permissions: {
        canManageOrgs: true,
        canManageOrgUsers: true,
        canManagePartnerUsers: false,
        canManageOrgAPIKeys: false,
        canManagePartnerAPIKeys: false,
        canUpdateEntitlements: true,
        canViewAuditLogs: true,
      },
    });

    console.log('User added to partner portal!');
    console.log(`  User ID: ${addPartnerUserResult.data.id}`);
    console.log(`  Email: ${addPartnerUserResult.data.email}`);
    console.log(`  Role: ${addPartnerUserResult.data.role}`);
    if (addPartnerUserResult.data.permissions) {
      console.log(`  Can Manage Orgs: ${addPartnerUserResult.data.permissions.canManageOrgs ? 'Yes' : 'No'}`);
    }
    console.log();

    const partnerUserId = addPartnerUserResult.data.id;

    // 7. LIST PARTNER PORTAL USERS
    console.log('7. Listing partner portal users...');

    const listPartnerUsersResult = await TurboPartner.listPartnerPortalUsers({
      limit: 50,
      offset: 0,
    });

    console.log(`Found ${listPartnerUsersResult.data.totalRecords} partner user(s)`);
    for (const user of listPartnerUsersResult.data.results) {
      console.log(`  - ${user.email} (${user.role})`);
    }
    console.log();

    // 8. UPDATE PARTNER USER PERMISSIONS
    console.log('8. Updating partner user permissions...');

    const updatePartnerUserResult = await TurboPartner.updatePartnerUserPermissions(
      partnerUserId,
      {
        role: 'admin',
        permissions: {
          canManageOrgs: true,
          canManageOrgUsers: true,
          canManagePartnerUsers: true,
          canManageOrgAPIKeys: true,
          canManagePartnerAPIKeys: true,
          canUpdateEntitlements: true,
          canViewAuditLogs: true,
        },
      },
    );

    console.log('Partner user permissions updated!');
    console.log(`  User ID: ${updatePartnerUserResult.data.userId}`);
    console.log(`  New Role: ${updatePartnerUserResult.data.role}\n`);

    // 9. RESEND PARTNER PORTAL INVITATION
    console.log('9. Resending partner portal invitation...');

    const resendPartnerResult = await TurboPartner.resendPartnerPortalInvitationToUser(partnerUserId);

    console.log('Partner invitation resent!');
    console.log(`  Success: ${resendPartnerResult.success}\n`);

    // 10. REMOVE USER FROM PARTNER PORTAL
    console.log('10. Removing user from partner portal...');

    const removePartnerUserResult = await TurboPartner.removeUserFromPartnerPortal(partnerUserId);

    console.log('User removed from partner portal!');
    console.log(`  Success: ${removePartnerUserResult.success}\n`);

    // Cleanup: Delete the test organization
    console.log('Cleaning up: Deleting test organization...');
    await TurboPartner.deleteOrganization(organizationId);
    console.log('Test organization deleted.');

    console.log('\n=== All user management operations completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
    if (error.errorCode) {
      console.error(`Error Code: ${error.errorCode}`);
    }
  }
}

// Run the example
userManagementExample();
