<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Types\Partner\Organization;
use TurboDocx\Types\Partner\OrganizationUser;
use TurboDocx\Types\Partner\OrgApiKey;
use TurboDocx\Types\Partner\PartnerUser;
use TurboDocx\Types\Partner\PartnerApiKey;
use TurboDocx\Types\Partner\PartnerPermissions;
use TurboDocx\Types\Partner\Features;
use TurboDocx\Types\Partner\Tracking;
use TurboDocx\Types\Partner\AuditLogEntry;

final class TurboPartnerTypesTest extends TestCase
{
    // =============================================
    // Organization Tests
    // =============================================

    public function testOrganizationFromArray(): void
    {
        $data = [
            'id' => 'org-123',
            'name' => 'Test Organization',
            'partnerId' => 'partner-456',
            'createdOn' => '2024-01-15T10:30:00Z',
            'isActive' => true,
            'userCount' => 5,
        ];

        $org = Organization::fromArray($data);

        $this->assertEquals('org-123', $org->id);
        $this->assertEquals('Test Organization', $org->name);
        $this->assertEquals('partner-456', $org->partnerId);
        $this->assertTrue($org->isActive);
        $this->assertEquals(5, $org->userCount);
    }

    public function testOrganizationToArrayFiltersNulls(): void
    {
        $data = [
            'id' => 'org-123',
            'name' => 'Test Org',
        ];

        $org = Organization::fromArray($data);
        $array = $org->toArray();

        $this->assertEquals('org-123', $array['id']);
        $this->assertEquals('Test Org', $array['name']);
        $this->assertArrayNotHasKey('partnerId', $array);
        $this->assertArrayNotHasKey('createdOn', $array);
        $this->assertArrayNotHasKey('isActive', $array);
    }

    public function testOrganizationJsonSerialize(): void
    {
        $org = Organization::fromArray(['id' => 'org-1', 'name' => 'Test']);
        $json = json_encode($org);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertEquals('Test', $decoded['name']);
        $this->assertArrayNotHasKey('partnerId', $decoded);
    }

    // =============================================
    // OrganizationUser Tests
    // =============================================

    public function testOrganizationUserFromArray(): void
    {
        $data = [
            'id' => 'user-123',
            'email' => 'user@example.com',
            'role' => 'admin',
            'isActive' => true,
            'firstName' => 'John',
        ];

        $user = OrganizationUser::fromArray($data);

        $this->assertEquals('user-123', $user->id);
        $this->assertEquals('user@example.com', $user->email);
        $this->assertEquals('admin', $user->role);
        $this->assertTrue($user->isActive);
    }

    public function testOrganizationUserToArrayFiltersNulls(): void
    {
        $data = [
            'id' => 'user-123',
            'email' => 'test@example.com',
            'role' => 'contributor',
        ];

        $user = OrganizationUser::fromArray($data);
        $array = $user->toArray();

        $this->assertArrayNotHasKey('firstName', $array);
        $this->assertArrayNotHasKey('isActive', $array);
    }

    public function testOrganizationUserJsonSerialize(): void
    {
        $user = OrganizationUser::fromArray([
            'id' => 'u1',
            'email' => 'test@test.com',
            'role' => 'viewer',
        ]);
        $json = json_encode($user);

        $this->assertIsString($json);
    }

    // =============================================
    // OrgApiKey Tests
    // =============================================

    public function testOrgApiKeyFromArray(): void
    {
        $data = [
            'id' => 'key-123',
            'name' => 'Production API Key',
            'key' => 'TDX-abc123xyz',
            'role' => 'admin',
            'orgId' => 'org-456',
            'createdOn' => '2024-01-15T10:30:00Z',
        ];

        $apiKey = OrgApiKey::fromArray($data);

        $this->assertEquals('key-123', $apiKey->id);
        $this->assertEquals('Production API Key', $apiKey->name);
        $this->assertEquals('TDX-abc123xyz', $apiKey->key);
        $this->assertEquals('admin', $apiKey->role);
    }

    public function testOrgApiKeyToArrayFiltersNulls(): void
    {
        $data = [
            'id' => 'key-123',
            'name' => 'Test Key',
            'role' => 'admin',
        ];

        $apiKey = OrgApiKey::fromArray($data);
        $array = $apiKey->toArray();

        $this->assertArrayNotHasKey('key', $array);
        $this->assertArrayNotHasKey('orgId', $array);
    }

    public function testOrgApiKeyJsonSerialize(): void
    {
        $apiKey = OrgApiKey::fromArray([
            'id' => 'k1',
            'name' => 'Key',
            'role' => 'contributor',
        ]);
        $json = json_encode($apiKey);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertArrayNotHasKey('key', $decoded);
    }

    // =============================================
    // PartnerUser Tests
    // =============================================

    public function testPartnerUserFromArray(): void
    {
        $data = [
            'id' => 'puser-123',
            'email' => 'partner@example.com',
            'role' => 'admin',
            'permissions' => [
                'canManageOrgs' => true,
                'canManageOrgUsers' => true,
                'canManagePartnerUsers' => false,
                'canManageOrgAPIKeys' => false,
                'canManagePartnerAPIKeys' => false,
                'canUpdateEntitlements' => true,
                'canViewAuditLogs' => true,
            ],
            'status' => 'active',
        ];

        $user = PartnerUser::fromArray($data);

        $this->assertEquals('puser-123', $user->id);
        $this->assertEquals('partner@example.com', $user->email);
        $this->assertEquals('admin', $user->role);
        $this->assertNotNull($user->permissions);
        $this->assertTrue($user->permissions->canManageOrgs);
        $this->assertFalse($user->permissions->canManagePartnerUsers);
    }

    public function testPartnerUserToArrayFiltersNulls(): void
    {
        $data = [
            'id' => 'puser-123',
            'email' => 'test@example.com',
            'role' => 'member',
        ];

        $user = PartnerUser::fromArray($data);
        $array = $user->toArray();

        $this->assertArrayNotHasKey('permissions', $array);
        $this->assertArrayNotHasKey('status', $array);
    }

    public function testPartnerUserJsonSerialize(): void
    {
        $user = PartnerUser::fromArray([
            'id' => 'pu1',
            'email' => 'test@test.com',
            'role' => 'viewer',
        ]);
        $json = json_encode($user);

        $this->assertIsString($json);
    }

    // =============================================
    // PartnerApiKey Tests
    // =============================================

    public function testPartnerApiKeyFromArray(): void
    {
        $data = [
            'id' => 'pkey-123',
            'name' => 'Integration Key',
            'key' => 'TDXP-a1b2...3xyz',
            'scopes' => ['org:create', 'org:read', 'org:update'],
            'description' => 'For third-party integration',
            'createdOn' => '2024-01-15T10:30:00Z',
        ];

        $apiKey = PartnerApiKey::fromArray($data);

        $this->assertEquals('pkey-123', $apiKey->id);
        $this->assertEquals('Integration Key', $apiKey->name);
        $this->assertEquals('TDXP-a1b2...3xyz', $apiKey->key);
        $this->assertEquals(['org:create', 'org:read', 'org:update'], $apiKey->scopes);
    }

    public function testPartnerApiKeyToArrayFiltersNulls(): void
    {
        $data = [
            'id' => 'pkey-123',
            'name' => 'Test Key',
        ];

        $apiKey = PartnerApiKey::fromArray($data);
        $array = $apiKey->toArray();

        $this->assertArrayNotHasKey('key', $array);
        $this->assertArrayNotHasKey('scopes', $array);
        $this->assertArrayNotHasKey('description', $array);
    }

    public function testPartnerApiKeyJsonSerialize(): void
    {
        $apiKey = PartnerApiKey::fromArray([
            'id' => 'pk1',
            'name' => 'Key',
            'scopes' => ['org:read'],
        ]);
        $json = json_encode($apiKey);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertEquals(['org:read'], $decoded['scopes']);
    }

    // =============================================
    // PartnerPermissions Tests
    // =============================================

    public function testPartnerPermissionsFromArray(): void
    {
        $data = [
            'canManageOrgs' => true,
            'canManageOrgUsers' => true,
            'canManagePartnerUsers' => false,
            'canManageOrgAPIKeys' => false,
            'canManagePartnerAPIKeys' => false,
            'canUpdateEntitlements' => true,
            'canViewAuditLogs' => true,
        ];

        $permissions = PartnerPermissions::fromArray($data);

        $this->assertTrue($permissions->canManageOrgs);
        $this->assertTrue($permissions->canManageOrgUsers);
        $this->assertFalse($permissions->canManagePartnerUsers);
        $this->assertTrue($permissions->canUpdateEntitlements);
    }

    public function testPartnerPermissionsDefaults(): void
    {
        $permissions = new PartnerPermissions();

        $this->assertFalse($permissions->canManageOrgs);
        $this->assertFalse($permissions->canManageOrgUsers);
        $this->assertFalse($permissions->canManagePartnerUsers);
    }

    public function testPartnerPermissionsToArray(): void
    {
        $permissions = new PartnerPermissions(
            canManageOrgs: true,
            canManageOrgUsers: true,
            canManagePartnerUsers: true,
            canManageOrgAPIKeys: true,
            canManagePartnerAPIKeys: true,
            canUpdateEntitlements: true,
            canViewAuditLogs: true
        );

        $array = $permissions->toArray();

        // All 7 permissions should be present (no null filtering for booleans)
        $this->assertCount(7, $array);
        $this->assertTrue($array['canManageOrgs']);
        $this->assertTrue($array['canManagePartnerUsers']);
    }

    public function testPartnerPermissionsJsonSerialize(): void
    {
        $permissions = PartnerPermissions::fromArray([
            'canManageOrgs' => true,
            'canViewAuditLogs' => false,
        ]);
        $json = json_encode($permissions);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertTrue($decoded['canManageOrgs']);
        $this->assertFalse($decoded['canViewAuditLogs']);
    }

    // =============================================
    // Features Tests
    // =============================================

    public function testFeaturesFromArray(): void
    {
        $data = [
            'maxUsers' => 100,
            'maxStorage' => 10737418240,
            'hasTDAI' => true,
            'hasTDWriter' => false,
            'hasBetaFeatures' => true,
            'enableBulkSending' => false,
        ];

        $features = Features::fromArray($data);

        $this->assertEquals(100, $features->maxUsers);
        $this->assertEquals(10737418240, $features->maxStorage);
        $this->assertTrue($features->hasTDAI);
        $this->assertFalse($features->hasTDWriter);
        $this->assertTrue($features->hasBetaFeatures);
        $this->assertFalse($features->enableBulkSending);
    }

    public function testFeaturesToArrayFiltersNulls(): void
    {
        $data = [
            'maxUsers' => 50,
            'hasTDAI' => true,
        ];

        $features = Features::fromArray($data);
        $array = $features->toArray();

        $this->assertEquals(50, $array['maxUsers']);
        $this->assertTrue($array['hasTDAI']);
        $this->assertArrayNotHasKey('maxStorage', $array);
        $this->assertArrayNotHasKey('hasTDWriter', $array);
        $this->assertArrayNotHasKey('hasBetaFeatures', $array);
        $this->assertArrayNotHasKey('enableBulkSending', $array);
    }

    public function testFeaturesJsonSerialize(): void
    {
        $features = Features::fromArray([
            'maxUsers' => 25,
            'maxStorage' => 5368709120,
        ]);
        $json = json_encode($features);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertEquals(25, $decoded['maxUsers']);
        $this->assertArrayNotHasKey('hasTDAI', $decoded);
    }

    // =============================================
    // Tracking Tests
    // =============================================

    public function testTrackingFromArray(): void
    {
        $data = [
            'numUsers' => 10,
            'storageUsed' => 5368709120,
            'numSignaturesUsed' => 25,
        ];

        $tracking = Tracking::fromArray($data);

        $this->assertEquals(10, $tracking->numUsers);
        $this->assertEquals(5368709120, $tracking->storageUsed);
        $this->assertEquals(25, $tracking->numSignaturesUsed);
    }

    public function testTrackingToArrayFiltersNulls(): void
    {
        $data = [
            'numUsers' => 5,
        ];

        $tracking = Tracking::fromArray($data);
        $array = $tracking->toArray();

        $this->assertEquals(5, $array['numUsers']);
        $this->assertArrayNotHasKey('storageUsed', $array);
        $this->assertArrayNotHasKey('numSignaturesUsed', $array);
    }

    public function testTrackingJsonSerialize(): void
    {
        $tracking = Tracking::fromArray([
            'numUsers' => 15,
            'numTemplates' => 30,
        ]);
        $json = json_encode($tracking);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertEquals(15, $decoded['numUsers']);
    }

    // =============================================
    // AuditLogEntry Tests
    // =============================================

    public function testAuditLogEntryFromArray(): void
    {
        $data = [
            'id' => 'log-123',
            'partnerId' => 'partner-456',
            'action' => 'ORG_CREATED',
            'resourceType' => 'organization',
            'resourceId' => 'org-789',
            'success' => true,
            'ipAddress' => '192.168.1.1',
            'createdOn' => '2024-01-15T10:30:00Z',
        ];

        $entry = AuditLogEntry::fromArray($data);

        $this->assertEquals('log-123', $entry->id);
        $this->assertEquals('partner-456', $entry->partnerId);
        $this->assertEquals('ORG_CREATED', $entry->action);
        $this->assertEquals('organization', $entry->resourceType);
        $this->assertTrue($entry->success);
    }

    public function testAuditLogEntryToArrayFiltersNulls(): void
    {
        $data = [
            'id' => 'log-123',
            'partnerId' => 'partner-456',
            'action' => 'USER_ADDED',
        ];

        $entry = AuditLogEntry::fromArray($data);
        $array = $entry->toArray();

        $this->assertEquals('log-123', $array['id']);
        $this->assertEquals('USER_ADDED', $array['action']);
        $this->assertArrayNotHasKey('resourceType', $array);
        $this->assertArrayNotHasKey('ipAddress', $array);
    }

    public function testAuditLogEntryJsonSerialize(): void
    {
        $entry = AuditLogEntry::fromArray([
            'id' => 'log-1',
            'partnerId' => 'p-1',
            'action' => 'API_KEY_CREATED',
            'success' => true,
        ]);
        $json = json_encode($entry);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertEquals('API_KEY_CREATED', $decoded['action']);
        $this->assertTrue($decoded['success']);
        $this->assertArrayNotHasKey('resourceType', $decoded);
    }
}
