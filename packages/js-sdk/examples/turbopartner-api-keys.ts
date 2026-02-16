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
 * Run: npx tsx examples/turbopartner-api-keys.ts
 */

import { TurboPartner } from '@turbodocx/sdk';

async function apiKeyManagementExample(): Promise<void> {
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
      name: 'API Key Test Organization',
    });
    const organizationId = orgResult.data.id;
    console.log(`Organization created: ${organizationId}\n`);

    // =============================================
    // ORGANIZATION API KEY MANAGEMENT
    // =============================================

    console.log('=== ORGANIZATION API KEY MANAGEMENT ===\n');

    // 1. CREATE ORGANIZATION API KEY
    console.log('1. Creating organization API key...');

    const createOrgKeyResult = await TurboPartner.createOrganizationApiKey(organizationId, {
      name: 'Production API Key',
      role: 'admin',
    });

    console.log('Organization API key created!');
    console.log(`  Key ID: ${createOrgKeyResult.data.id}`);
    console.log(`  Name: ${createOrgKeyResult.data.name}`);
    console.log(`  Role: ${createOrgKeyResult.data.role}`);
    if (createOrgKeyResult.data.key) {
      console.log(`  Full Key (SAVE THIS!): ${createOrgKeyResult.data.key}`);
    }
    console.log();

    const orgApiKeyId = createOrgKeyResult.data.id;

    // 2. LIST ORGANIZATION API KEYS
    console.log('2. Listing organization API keys...');

    const listOrgKeysResult = await TurboPartner.listOrganizationApiKeys(organizationId, {
      limit: 50,
      offset: 0,
    });

    console.log(`Found ${listOrgKeysResult.data.totalRecords} API key(s)`);
    for (const key of listOrgKeysResult.data.results) {
      console.log(`  - ${key.name} (ID: ${key.id}, Role: ${key.role})`);
    }
    console.log();

    // 3. UPDATE ORGANIZATION API KEY
    console.log('3. Updating organization API key...');

    const updateOrgKeyResult = await TurboPartner.updateOrganizationApiKey(
      organizationId,
      orgApiKeyId,
      {
        name: 'Production API Key (Updated)',
        role: 'contributor',
      },
    );

    console.log('Organization API key updated!');
    console.log(`  Key ID: ${updateOrgKeyResult.apiKey.id}`);
    console.log(`  New Name: ${updateOrgKeyResult.apiKey.name}`);
    console.log(`  New Role: ${updateOrgKeyResult.apiKey.role}`);
    console.log();

    // 4. REVOKE ORGANIZATION API KEY
    console.log('4. Revoking organization API key...');

    const revokeOrgKeyResult = await TurboPartner.revokeOrganizationApiKey(
      organizationId,
      orgApiKeyId,
    );

    console.log('Organization API key revoked!');
    console.log(`  Success: ${revokeOrgKeyResult.success}\n`);

    // =============================================
    // PARTNER API KEY MANAGEMENT
    // =============================================

    console.log('=== PARTNER API KEY MANAGEMENT ===\n');

    // 5. CREATE PARTNER API KEY
    console.log('5. Creating partner API key...');

    const createPartnerKeyResult = await TurboPartner.createPartnerApiKey({
      name: 'Integration Partner Key',
      scopes: [
        'org:create',
        'org:read',
        'org:update',
        'org:delete',
        'entitlements:update',
        'audit:read',
      ],
      description: 'API key for third-party integration',
    });

    console.log('Partner API key created!');
    console.log(`  Key ID: ${createPartnerKeyResult.data.id}`);
    console.log(`  Name: ${createPartnerKeyResult.data.name}`);
    if (createPartnerKeyResult.data.key) {
      console.log(`  Full Key (SAVE THIS!): ${createPartnerKeyResult.data.key}`);
    }
    if (createPartnerKeyResult.data.scopes) {
      console.log(`  Scopes: ${createPartnerKeyResult.data.scopes.join(', ')}`);
    }
    console.log();

    const partnerApiKeyId = createPartnerKeyResult.data.id;

    // 6. LIST PARTNER API KEYS
    console.log('6. Listing partner API keys...');

    const listPartnerKeysResult = await TurboPartner.listPartnerApiKeys({
      limit: 50,
      offset: 0,
    });

    console.log(`Found ${listPartnerKeysResult.data.totalRecords} partner API key(s)`);
    for (const key of listPartnerKeysResult.data.results) {
      // Listed keys show a masked preview (e.g. "TDXP-a1b2...5e6f"), never the full key
      console.log(`  - ${key.name} (ID: ${key.id}, Key: ${key.key})`);
    }
    console.log();

    // 7. UPDATE PARTNER API KEY
    console.log('7. Updating partner API key...');

    const updatePartnerKeyResult = await TurboPartner.updatePartnerApiKey(partnerApiKeyId, {
      name: 'Integration Partner Key (Updated)',
      description: 'Updated description for the integration key',
    });

    console.log('Partner API key updated!');
    console.log(`  Key ID: ${updatePartnerKeyResult.apiKey.id}`);
    console.log(`  New Name: ${updatePartnerKeyResult.apiKey.name}`);
    console.log();

    // 8. REVOKE PARTNER API KEY
    console.log('8. Revoking partner API key...');

    const revokePartnerKeyResult = await TurboPartner.revokePartnerApiKey(partnerApiKeyId);

    console.log('Partner API key revoked!');
    console.log(`  Success: ${revokePartnerKeyResult.success}\n`);

    // =============================================
    // AUDIT LOGS
    // =============================================

    console.log('=== AUDIT LOGS ===\n');

    // 9. GET PARTNER AUDIT LOGS
    console.log('9. Getting partner audit logs...');

    const auditLogsResult = await TurboPartner.getPartnerAuditLogs({
      limit: 20,
      offset: 0,
    });

    console.log(`Found ${auditLogsResult.data.totalRecords} audit log entries`);
    console.log(`Showing first ${auditLogsResult.data.limit} entries:\n`);

    for (const entry of auditLogsResult.data.results) {
      console.log(`  Action: ${entry.action}`);
      if (entry.resourceType) {
        let line = `    Resource: ${entry.resourceType}`;
        if (entry.resourceId) {
          line += ` (ID: ${entry.resourceId})`;
        }
        console.log(line);
      }
      if (entry.createdOn) {
        console.log(`    Time: ${entry.createdOn}`);
      }
      console.log();
    }

    // Cleanup: Delete the test organization
    console.log('Cleaning up: Deleting test organization...');
    await TurboPartner.deleteOrganization(organizationId);
    console.log('Test organization deleted.');

    console.log('\n=== All API key and audit log operations completed successfully! ===');
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
apiKeyManagementExample();
