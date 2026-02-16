<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Exceptions\ValidationException;
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

final class TurboPartnerRequestsTest extends TestCase
{
    // =============================================
    // CreateOrganizationRequest Tests
    // =============================================

    public function testCreateOrganizationRequestToArray(): void
    {
        $request = new CreateOrganizationRequest(
            name: 'Test Organization'
        );

        $this->assertEquals(['name' => 'Test Organization'], $request->toArray());
    }

    public function testCreateOrganizationRequestWithMetadata(): void
    {
        $request = new CreateOrganizationRequest(
            name: 'Test Organization',
            metadata: ['key' => 'value']
        );

        $array = $request->toArray();
        $this->assertEquals('Test Organization', $array['name']);
        $this->assertEquals(['key' => 'value'], $array['metadata']);
    }

    public function testCreateOrganizationRequestWithFeatures(): void
    {
        $request = new CreateOrganizationRequest(
            name: 'Test Organization',
            features: ['maxUsers' => 50]
        );

        $array = $request->toArray();
        $this->assertEquals(['maxUsers' => 50], $array['features']);
    }

    public function testCreateOrganizationRequestEmptyNameThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreateOrganizationRequest(name: '');
    }

    public function testCreateOrganizationRequestTooLongNameThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreateOrganizationRequest(name: str_repeat('a', 256));
    }

    // =============================================
    // UpdateOrganizationRequest Tests
    // =============================================

    public function testUpdateOrganizationRequestToArray(): void
    {
        $request = new UpdateOrganizationRequest(name: 'Updated Organization');

        $this->assertEquals(['name' => 'Updated Organization'], $request->toArray());
    }

    public function testUpdateOrganizationRequestEmptyNameThrows(): void
    {
        $this->expectException(ValidationException::class);
        new UpdateOrganizationRequest(name: '');
    }

    // =============================================
    // UpdateEntitlementsRequest Tests
    // =============================================

    public function testUpdateEntitlementsRequestWithFeatures(): void
    {
        $request = new UpdateEntitlementsRequest(
            features: ['maxUsers' => 100, 'hasTDAI' => true]
        );

        $array = $request->toArray();
        $this->assertEquals(['maxUsers' => 100, 'hasTDAI' => true], $array['features']);
        $this->assertArrayNotHasKey('tracking', $array);
    }

    public function testUpdateEntitlementsRequestWithTracking(): void
    {
        $request = new UpdateEntitlementsRequest(
            tracking: ['numUsers' => 10]
        );

        $array = $request->toArray();
        $this->assertArrayNotHasKey('features', $array);
        $this->assertEquals(['numUsers' => 10], $array['tracking']);
    }

    public function testUpdateEntitlementsRequestWithBoth(): void
    {
        $request = new UpdateEntitlementsRequest(
            features: ['maxUsers' => 50],
            tracking: ['numUsers' => 5, 'storageUsed' => 1073741824]
        );

        $array = $request->toArray();
        $this->assertEquals(['maxUsers' => 50], $array['features']);
        $this->assertEquals(['numUsers' => 5, 'storageUsed' => 1073741824], $array['tracking']);
    }

    public function testUpdateEntitlementsRequestEmpty(): void
    {
        $request = new UpdateEntitlementsRequest();

        $this->assertEquals([], $request->toArray());
    }

    // =============================================
    // ListOrganizationsRequest Tests
    // =============================================

    public function testListOrganizationsRequestDefaults(): void
    {
        $request = new ListOrganizationsRequest();

        $params = $request->toQueryParams();
        $this->assertEquals(50, $params['limit']);
        $this->assertEquals(0, $params['offset']);
        $this->assertArrayNotHasKey('search', $params);
    }

    public function testListOrganizationsRequestWithSearch(): void
    {
        $request = new ListOrganizationsRequest(
            limit: 10,
            offset: 20,
            search: 'Acme'
        );

        $params = $request->toQueryParams();
        $this->assertEquals(10, $params['limit']);
        $this->assertEquals(20, $params['offset']);
        $this->assertEquals('Acme', $params['search']);
    }

    // =============================================
    // AddOrgUserRequest Tests
    // =============================================

    public function testAddOrgUserRequestToArray(): void
    {
        $request = new AddOrgUserRequest(
            email: 'user@example.com',
            role: OrgUserRole::ADMIN
        );

        $array = $request->toArray();
        $this->assertEquals('user@example.com', $array['email']);
        $this->assertEquals('admin', $array['role']);
    }

    public function testAddOrgUserRequestContributorRole(): void
    {
        $request = new AddOrgUserRequest(
            email: 'contributor@example.com',
            role: OrgUserRole::CONTRIBUTOR
        );

        $this->assertEquals('contributor', $request->toArray()['role']);
    }

    public function testAddOrgUserRequestViewerRole(): void
    {
        $request = new AddOrgUserRequest(
            email: 'viewer@example.com',
            role: OrgUserRole::VIEWER
        );

        $this->assertEquals('viewer', $request->toArray()['role']);
    }

    public function testAddOrgUserRequestInvalidEmailThrows(): void
    {
        $this->expectException(ValidationException::class);
        new AddOrgUserRequest(
            email: 'invalid-email',
            role: OrgUserRole::ADMIN
        );
    }

    // =============================================
    // UpdateOrgUserRequest Tests
    // =============================================

    public function testUpdateOrgUserRequestToArray(): void
    {
        $request = new UpdateOrgUserRequest(role: OrgUserRole::CONTRIBUTOR);

        $this->assertEquals(['role' => 'contributor'], $request->toArray());
    }

    // =============================================
    // ListOrgUsersRequest Tests
    // =============================================

    public function testListOrgUsersRequestDefaults(): void
    {
        $request = new ListOrgUsersRequest();

        $params = $request->toQueryParams();
        $this->assertEquals(50, $params['limit']);
        $this->assertEquals(0, $params['offset']);
    }

    public function testListOrgUsersRequestCustomValues(): void
    {
        $request = new ListOrgUsersRequest(limit: 25, offset: 50);

        $params = $request->toQueryParams();
        $this->assertEquals(25, $params['limit']);
        $this->assertEquals(50, $params['offset']);
    }

    // =============================================
    // CreateOrgApiKeyRequest Tests
    // =============================================

    public function testCreateOrgApiKeyRequestToArray(): void
    {
        $request = new CreateOrgApiKeyRequest(
            name: 'Production Key',
            role: 'admin'
        );

        $array = $request->toArray();
        $this->assertEquals('Production Key', $array['name']);
        $this->assertEquals('admin', $array['role']);
    }

    public function testCreateOrgApiKeyRequestEmptyNameThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreateOrgApiKeyRequest(name: '', role: 'admin');
    }

    // =============================================
    // UpdateOrgApiKeyRequest Tests
    // =============================================

    public function testUpdateOrgApiKeyRequestToArray(): void
    {
        $request = new UpdateOrgApiKeyRequest(
            name: 'Updated Key Name',
            role: 'contributor'
        );

        $array = $request->toArray();
        $this->assertEquals('Updated Key Name', $array['name']);
        $this->assertEquals('contributor', $array['role']);
    }

    // =============================================
    // ListOrgApiKeysRequest Tests
    // =============================================

    public function testListOrgApiKeysRequestDefaults(): void
    {
        $request = new ListOrgApiKeysRequest();

        $params = $request->toQueryParams();
        $this->assertEquals(50, $params['limit']);
        $this->assertEquals(0, $params['offset']);
    }

    // =============================================
    // CreatePartnerApiKeyRequest Tests
    // =============================================

    public function testCreatePartnerApiKeyRequestToArray(): void
    {
        $request = new CreatePartnerApiKeyRequest(
            name: 'Integration Key',
            scopes: [PartnerScope::ORG_CREATE, PartnerScope::ORG_READ]
        );

        $array = $request->toArray();
        $this->assertEquals('Integration Key', $array['name']);
        $this->assertEquals(['org:create', 'org:read'], $array['scopes']);
        $this->assertArrayNotHasKey('description', $array);
    }

    public function testCreatePartnerApiKeyRequestWithAllOptions(): void
    {
        $request = new CreatePartnerApiKeyRequest(
            name: 'Full Key',
            scopes: [PartnerScope::ORG_CREATE],
            description: 'Test description',
        );

        $array = $request->toArray();
        $this->assertEquals('Full Key', $array['name']);
        $this->assertEquals('Test description', $array['description']);
    }

    public function testCreatePartnerApiKeyRequestEmptyNameThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreatePartnerApiKeyRequest(name: '', scopes: [PartnerScope::ORG_CREATE]);
    }

    public function testCreatePartnerApiKeyRequestEmptyScopesThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreatePartnerApiKeyRequest(name: 'Test', scopes: []);
    }

    // =============================================
    // UpdatePartnerApiKeyRequest Tests
    // =============================================

    public function testUpdatePartnerApiKeyRequestToArray(): void
    {
        $request = new UpdatePartnerApiKeyRequest(
            name: 'Updated Key',
            description: 'New description'
        );

        $array = $request->toArray();
        $this->assertEquals('Updated Key', $array['name']);
        $this->assertEquals('New description', $array['description']);
    }

    // =============================================
    // ListPartnerApiKeysRequest Tests
    // =============================================

    public function testListPartnerApiKeysRequestDefaults(): void
    {
        $request = new ListPartnerApiKeysRequest();

        $params = $request->toQueryParams();
        $this->assertEquals(50, $params['limit']);
        $this->assertEquals(0, $params['offset']);
    }

    // =============================================
    // AddPartnerUserRequest Tests
    // =============================================

    public function testAddPartnerUserRequestToArray(): void
    {
        $permissions = new PartnerPermissions(
            canManageOrgs: true,
            canManageOrgUsers: true,
            canManagePartnerUsers: false,
            canManageOrgAPIKeys: false,
            canManagePartnerAPIKeys: false,
            canUpdateEntitlements: true,
            canViewAuditLogs: true
        );

        $request = new AddPartnerUserRequest(
            email: 'partner@example.com',
            role: 'member',
            permissions: $permissions
        );

        $array = $request->toArray();
        $this->assertEquals('partner@example.com', $array['email']);
        $this->assertEquals('member', $array['role']);
        $this->assertTrue($array['permissions']['canManageOrgs']);
        $this->assertFalse($array['permissions']['canManagePartnerUsers']);
    }

    public function testAddPartnerUserRequestInvalidEmailThrows(): void
    {
        $permissions = new PartnerPermissions(
            canManageOrgs: true,
            canManageOrgUsers: true,
            canManagePartnerUsers: false,
            canManageOrgAPIKeys: false,
            canManagePartnerAPIKeys: false,
            canUpdateEntitlements: true,
            canViewAuditLogs: true
        );

        $this->expectException(ValidationException::class);
        new AddPartnerUserRequest(
            email: 'invalid',
            role: 'member',
            permissions: $permissions
        );
    }

    // =============================================
    // UpdatePartnerUserRequest Tests
    // =============================================

    public function testUpdatePartnerUserRequestWithRole(): void
    {
        $request = new UpdatePartnerUserRequest(role: 'admin');

        $array = $request->toArray();
        $this->assertEquals('admin', $array['role']);
        $this->assertArrayNotHasKey('permissions', $array);
    }

    public function testUpdatePartnerUserRequestWithPermissions(): void
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

        $request = new UpdatePartnerUserRequest(permissions: $permissions);

        $array = $request->toArray();
        $this->assertArrayNotHasKey('role', $array);
        $this->assertTrue($array['permissions']['canManagePartnerUsers']);
    }

    public function testUpdatePartnerUserRequestEmpty(): void
    {
        $request = new UpdatePartnerUserRequest();

        $this->assertEquals([], $request->toArray());
    }

    // =============================================
    // ListPartnerUsersRequest Tests
    // =============================================

    public function testListPartnerUsersRequestDefaults(): void
    {
        $request = new ListPartnerUsersRequest();

        $params = $request->toQueryParams();
        $this->assertEquals(50, $params['limit']);
        $this->assertEquals(0, $params['offset']);
    }

    // =============================================
    // ListAuditLogsRequest Tests
    // =============================================

    public function testListAuditLogsRequestDefaults(): void
    {
        $request = new ListAuditLogsRequest();

        $params = $request->toQueryParams();
        $this->assertEquals(50, $params['limit']);
        $this->assertEquals(0, $params['offset']);
        $this->assertArrayNotHasKey('search', $params);
        $this->assertArrayNotHasKey('action', $params);
    }

    public function testListAuditLogsRequestWithAllFilters(): void
    {
        $request = new ListAuditLogsRequest(
            limit: 20,
            offset: 10,
            search: 'created',
            action: 'ORG_CREATED',
            resourceType: 'organization',
            resourceId: '12345678-1234-1234-1234-123456789012',
            success: true,
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        );

        $params = $request->toQueryParams();
        $this->assertEquals(20, $params['limit']);
        $this->assertEquals(10, $params['offset']);
        $this->assertEquals('created', $params['search']);
        $this->assertEquals('ORG_CREATED', $params['action']);
        $this->assertEquals('organization', $params['resourceType']);
        $this->assertEquals('12345678-1234-1234-1234-123456789012', $params['resourceId']);
        $this->assertEquals('true', $params['success']);
        $this->assertEquals('2024-01-01', $params['startDate']);
        $this->assertEquals('2024-12-31', $params['endDate']);
    }

    public function testListAuditLogsRequestSuccessFalse(): void
    {
        $request = new ListAuditLogsRequest(success: false);

        $params = $request->toQueryParams();
        $this->assertEquals('false', $params['success']);
    }
}
