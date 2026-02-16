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
 * Run: npx tsx examples/turbopartner-organizations.ts
 */

import { TurboPartner } from '@turbodocx/sdk';

async function organizationManagementExample(): Promise<void> {
  // Configure the TurboPartner client
  TurboPartner.configure({
    partnerApiKey: process.env.TURBODOCX_PARTNER_API_KEY || 'your-partner-api-key-here',
    partnerId: process.env.TURBODOCX_PARTNER_ID || 'your-partner-id-here',
    baseUrl: process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com',
  });

  try {
    // =============================================
    // 1. CREATE ORGANIZATION
    // =============================================
    console.log('1. Creating organization...');

    const createResult = await TurboPartner.createOrganization({
      name: 'Acme Corporation',
    });

    console.log('Organization created!');
    console.log(`  ID: ${createResult.data.id}`);
    console.log(`  Name: ${createResult.data.name}`);
    console.log(`  Partner ID: ${createResult.data.partnerId}\n`);

    const organizationId = createResult.data.id;

    // =============================================
    // 2. LIST ORGANIZATIONS
    // =============================================
    console.log('2. Listing organizations...');

    const listResult = await TurboPartner.listOrganizations({
      limit: 10,
      offset: 0,
      search: 'Acme', // Optional search filter
    });

    console.log(`Found ${listResult.data.totalRecords} organization(s)`);
    for (const org of listResult.data.results) {
      console.log(`  - ${org.name} (ID: ${org.id})`);
    }
    console.log();

    // =============================================
    // 3. GET ORGANIZATION DETAILS
    // =============================================
    console.log('3. Getting organization details...');

    const detailResult = await TurboPartner.getOrganizationDetails(organizationId);

    console.log('Organization Details:');
    console.log(`  ID: ${detailResult.data.id}`);
    console.log(`  Name: ${detailResult.data.name}`);
    if (detailResult.data.features) {
      console.log(`  Max Users: ${detailResult.data.features.maxUsers}`);
      console.log(`  Max Storage: ${detailResult.data.features.maxStorage} bytes`);
    }
    console.log();

    // =============================================
    // 4. UPDATE ORGANIZATION INFO
    // =============================================
    console.log('4. Updating organization info...');

    const updateResult = await TurboPartner.updateOrganizationInfo(organizationId, {
      name: 'Acme Corporation (Updated)',
    });

    console.log('Organization updated!');
    console.log(`  New Name: ${updateResult.data.name}\n`);

    // =============================================
    // 5. UPDATE ORGANIZATION ENTITLEMENTS
    // =============================================
    console.log('5. Updating organization entitlements...');

    const entitlementsResult = await TurboPartner.updateOrganizationEntitlements(organizationId, {
      features: {
        maxUsers: 50,
        maxStorage: 10737418240, // 10GB
        maxSignatures: 100,
        hasTDAI: true,
        hasFileDownload: true,
      },
    });

    console.log('Entitlements updated!');
    if (entitlementsResult.data.features) {
      console.log(`  Max Users: ${entitlementsResult.data.features.maxUsers}`);
      console.log(`  Max Storage: ${entitlementsResult.data.features.maxStorage} bytes`);
    }
    console.log();

    // =============================================
    // 6. DELETE ORGANIZATION
    // =============================================
    console.log('6. Deleting organization...');

    const deleteResult = await TurboPartner.deleteOrganization(organizationId);

    console.log('Organization deleted!');
    console.log(`  Success: ${deleteResult.success}`);

    console.log('\n=== All organization operations completed successfully! ===');
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
organizationManagementExample();
