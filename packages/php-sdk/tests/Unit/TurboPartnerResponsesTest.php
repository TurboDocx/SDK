<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Types\Responses\Partner\OrganizationResponse;
use TurboDocx\Types\Responses\Partner\OrganizationListResponse;
use TurboDocx\Types\Responses\Partner\OrganizationDetailResponse;
use TurboDocx\Types\Responses\Partner\OrgUserResponse;
use TurboDocx\Types\Responses\Partner\OrgUserListResponse;
use TurboDocx\Types\Responses\Partner\OrgApiKeyResponse;
use TurboDocx\Types\Responses\Partner\OrgApiKeyListResponse;
use TurboDocx\Types\Responses\Partner\PartnerUserResponse;
use TurboDocx\Types\Responses\Partner\PartnerUserListResponse;
use TurboDocx\Types\Responses\Partner\PartnerApiKeyResponse;
use TurboDocx\Types\Responses\Partner\PartnerApiKeyListResponse;
use TurboDocx\Types\Responses\Partner\EntitlementsResponse;
use TurboDocx\Types\Responses\Partner\AuditLogListResponse;
use TurboDocx\Types\Responses\Partner\SuccessResponse;

final class TurboPartnerResponsesTest extends TestCase
{
    // =============================================
    // OrganizationResponse Tests
    // =============================================

    public function testOrganizationResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => '12345678-1234-1234-1234-123456789012',
                'name' => 'Test Org',
                'partnerId' => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                'createdOn' => '2024-01-15T10:30:00Z',
            ],
        ];

        $response = OrganizationResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals('12345678-1234-1234-1234-123456789012', $response->data->id);
        $this->assertEquals('Test Org', $response->data->name);
    }

    public function testOrganizationResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => '12345678-1234-1234-1234-123456789012',
                'name' => 'Test Org',
            ],
        ];

        $response = OrganizationResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertTrue($decoded['success']);
        $this->assertEquals('Test Org', $decoded['data']['name']);
    }

    // =============================================
    // OrganizationListResponse Tests
    // =============================================

    public function testOrganizationListResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [
                    ['id' => 'org-1', 'name' => 'Org 1'],
                    ['id' => 'org-2', 'name' => 'Org 2'],
                ],
                'totalRecords' => 2,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = OrganizationListResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertCount(2, $response->results);
        $this->assertEquals('Org 1', $response->results[0]->name);
        $this->assertEquals(2, $response->totalRecords);
    }

    public function testOrganizationListResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [['id' => 'org-1', 'name' => 'Org 1']],
                'totalRecords' => 1,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = OrganizationListResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertEquals(1, $decoded['data']['totalRecords']);
    }

    // =============================================
    // OrganizationDetailResponse Tests
    // =============================================

    public function testOrganizationDetailResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'org-123',
                'name' => 'Detailed Org',
                'features' => [
                    'maxUsers' => 100,
                    'maxStorage' => 5368709120,
                    'hasTDAI' => true,
                ],
                'tracking' => [
                    'numUsers' => 5,
                ],
            ],
        ];

        $response = OrganizationDetailResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals('Detailed Org', $response->organization->name);
        $this->assertNotNull($response->features);
        $this->assertEquals(100, $response->features->maxUsers);
    }

    public function testOrganizationDetailResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'org-123',
                'name' => 'Test',
                'features' => ['maxUsers' => 50],
            ],
        ];

        $response = OrganizationDetailResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
    }

    // =============================================
    // OrgUserResponse Tests
    // =============================================

    public function testOrgUserResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'user-123',
                'email' => 'user@example.com',
                'role' => 'admin',
                'status' => 'active',
            ],
        ];

        $response = OrgUserResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals('user@example.com', $response->data->email);
        $this->assertEquals('admin', $response->data->role);
    }

    public function testOrgUserResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'user-123',
                'email' => 'test@example.com',
                'role' => 'contributor',
            ],
        ];

        $response = OrgUserResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertEquals('contributor', $decoded['data']['role']);
    }

    // =============================================
    // OrgUserListResponse Tests
    // =============================================

    public function testOrgUserListResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [
                    ['id' => 'u1', 'email' => 'user1@example.com', 'role' => 'admin'],
                    ['id' => 'u2', 'email' => 'user2@example.com', 'role' => 'viewer'],
                ],
                'totalRecords' => 2,
                'limit' => 50,
                'offset' => 0,
            ],
            'userLimit' => ['max' => 25, 'current' => 2],
        ];

        $response = OrgUserListResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertCount(2, $response->results);
        $this->assertEquals(['max' => 25, 'current' => 2], $response->userLimit);
    }

    // =============================================
    // OrgApiKeyResponse Tests
    // =============================================

    public function testOrgApiKeyResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'key-123',
                'name' => 'Production Key',
                'key' => 'TDX-abc123',
                'role' => 'admin',
            ],
            'message' => 'API key created successfully',
        ];

        $response = OrgApiKeyResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals('Production Key', $response->data->name);
        $this->assertEquals('API key created successfully', $response->message);
    }

    public function testOrgApiKeyResponseFromApiKeyField(): void
    {
        // Test when response uses 'apiKey' instead of 'data'
        $data = [
            'success' => true,
            'apiKey' => [
                'id' => 'key-456',
                'name' => 'Updated Key',
                'role' => 'contributor',
            ],
            'message' => 'Key updated',
        ];

        $response = OrgApiKeyResponse::fromArray($data);

        $this->assertEquals('Updated Key', $response->data->name);
    }

    public function testOrgApiKeyResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'key-123',
                'name' => 'Test Key',
                'role' => 'admin',
            ],
        ];

        $response = OrgApiKeyResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertArrayNotHasKey('message', $decoded); // null fields excluded
    }

    // =============================================
    // OrgApiKeyListResponse Tests
    // =============================================

    public function testOrgApiKeyListResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [
                    ['id' => 'k1', 'name' => 'Key 1', 'role' => 'admin'],
                ],
                'totalRecords' => 1,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = OrgApiKeyListResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertCount(1, $response->results);
        $this->assertEquals('Key 1', $response->results[0]->name);
    }

    // =============================================
    // PartnerUserResponse Tests
    // =============================================

    public function testPartnerUserResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'puser-123',
                'email' => 'partner@example.com',
                'role' => 'admin',
                'permissions' => [
                    'canManageOrgs' => true,
                    'canManageOrgUsers' => true,
                    'canManagePartnerUsers' => true,
                    'canManageOrgAPIKeys' => true,
                    'canManagePartnerAPIKeys' => true,
                    'canUpdateEntitlements' => true,
                    'canViewAuditLogs' => true,
                ],
            ],
        ];

        $response = PartnerUserResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals('partner@example.com', $response->data->email);
        $this->assertNotNull($response->data->permissions);
        $this->assertTrue($response->data->permissions->canManageOrgs);
    }

    public function testPartnerUserResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'puser-123',
                'email' => 'test@example.com',
                'role' => 'member',
            ],
        ];

        $response = PartnerUserResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
    }

    // =============================================
    // PartnerUserListResponse Tests
    // =============================================

    public function testPartnerUserListResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [
                    ['id' => 'pu1', 'email' => 'user1@example.com', 'role' => 'admin'],
                ],
                'totalRecords' => 1,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = PartnerUserListResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertCount(1, $response->results);
    }

    // =============================================
    // PartnerApiKeyResponse Tests
    // =============================================

    public function testPartnerApiKeyResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'pkey-123',
                'name' => 'Partner Integration Key',
                'key' => 'TDXP-abc123',
                'scopes' => ['org:create', 'org:read'],
            ],
            'message' => 'Partner API key created',
        ];

        $response = PartnerApiKeyResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals('Partner Integration Key', $response->data->name);
        $this->assertEquals(['org:create', 'org:read'], $response->data->scopes);
    }

    public function testPartnerApiKeyResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'pkey-123',
                'name' => 'Test Key',
            ],
        ];

        $response = PartnerApiKeyResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
    }

    // =============================================
    // PartnerApiKeyListResponse Tests
    // =============================================

    public function testPartnerApiKeyListResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [
                    ['id' => 'pk1', 'name' => 'Key 1', 'key' => 'TDXP-a1b2...5e6f', 'scopes' => ['org:read']],
                    ['id' => 'pk2', 'name' => 'Key 2', 'key' => 'TDXP-c3d4...7g8h', 'scopes' => ['org:create']],
                ],
                'totalRecords' => 2,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = PartnerApiKeyListResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertCount(2, $response->results);
        $this->assertEquals(2, $response->totalRecords);
        // Listed keys contain masked preview, not the full key
        $this->assertEquals('TDXP-a1b2...5e6f', $response->results[0]->key);
    }

    // =============================================
    // EntitlementsResponse Tests
    // =============================================

    public function testEntitlementsResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'features' => [
                    'maxUsers' => 100,
                    'maxStorage' => 10737418240,
                    'hasTDAI' => true,
                ],
                'tracking' => [
                    'numUsers' => 5,
                    'storageUsed' => 1073741824,
                ],
            ],
        ];

        $response = EntitlementsResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertNotNull($response->features);
        $this->assertEquals(100, $response->features->maxUsers);
        $this->assertNotNull($response->tracking);
        $this->assertEquals(5, $response->tracking->numUsers);
    }

    public function testEntitlementsResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'features' => ['maxUsers' => 50],
            ],
        ];

        $response = EntitlementsResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
    }

    // =============================================
    // AuditLogListResponse Tests
    // =============================================

    public function testAuditLogListResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [
                    [
                        'id' => 'log-1',
                        'partnerId' => 'partner-123',
                        'action' => 'ORG_CREATED',
                        'resourceType' => 'organization',
                        'resourceId' => 'org-123',
                        'createdOn' => '2024-01-15T10:30:00Z',
                        'ipAddress' => '192.168.1.1',
                    ],
                ],
                'totalRecords' => 1,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = AuditLogListResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertCount(1, $response->results);
        $this->assertEquals('ORG_CREATED', $response->results[0]->action);
        $this->assertEquals('192.168.1.1', $response->results[0]->ipAddress);
    }

    public function testAuditLogListResponseJsonSerialize(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [],
                'totalRecords' => 0,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = AuditLogListResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertEquals(0, $decoded['data']['totalRecords']);
    }

    // =============================================
    // SuccessResponse Tests
    // =============================================

    public function testSuccessResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'message' => 'Operation completed successfully',
        ];

        $response = SuccessResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals('Operation completed successfully', $response->message);
    }

    public function testSuccessResponseWithoutMessage(): void
    {
        $data = ['success' => true];

        $response = SuccessResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertNull($response->message);
    }

    public function testSuccessResponseJsonSerialize(): void
    {
        $data = ['success' => true, 'message' => 'Done'];

        $response = SuccessResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertTrue($decoded['success']);
        $this->assertEquals('Done', $decoded['message']);
    }

    public function testSuccessResponseJsonSerializeWithoutMessage(): void
    {
        $data = ['success' => true];

        $response = SuccessResponse::fromArray($data);
        $json = json_encode($response);

        $this->assertIsString($json);
        $decoded = json_decode($json, true);
        $this->assertArrayNotHasKey('message', $decoded); // null fields excluded
    }
}
