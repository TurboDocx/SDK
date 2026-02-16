"""
TurboPartner Module Tests

Tests for all 25 TurboPartner operations:
- Organization management (6 methods)
- Organization user management (5 methods)
- Organization API key management (4 methods)
- Partner API key management (4 methods)
- Partner portal user management (5 methods)
- Audit logs (1 method)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from turbodocx_sdk import TurboPartner, AuthenticationError
from turbodocx_sdk.modules.partner import (
    SCOPE_ORG_READ,
    SCOPE_ORG_USERS_READ,
    SCOPE_AUDIT_READ,
)


PARTNER_ID = "test-partner-id"


class TestTurboPartnerConfigure:
    """Test TurboPartner configuration"""

    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    def test_configure_with_credentials(self):
        TurboPartner.configure(
            partner_api_key="TDXP-test-key",
            partner_id=PARTNER_ID
        )
        assert TurboPartner._client is not None
        assert TurboPartner._partner_id == PARTNER_ID

    def test_configure_with_custom_base_url(self):
        TurboPartner.configure(
            partner_api_key="TDXP-test-key",
            partner_id=PARTNER_ID,
            base_url="https://custom-api.example.com"
        )
        assert TurboPartner._client.base_url == "https://custom-api.example.com"

    def test_configure_requires_partner_api_key(self):
        with pytest.raises(AuthenticationError, match="Partner API key"):
            TurboPartner.configure(partner_id=PARTNER_ID)

    def test_configure_requires_partner_id(self):
        with pytest.raises(AuthenticationError, match="Partner ID"):
            TurboPartner.configure(partner_api_key="TDXP-test-key")

    def test_not_configured_raises_error(self):
        with pytest.raises(RuntimeError, match="not configured"):
            TurboPartner._get_client()


# =========================================================================
# Organization Management
# =========================================================================

class TestCreateOrganization:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_create_organization(self):
        mock_response = {
            "success": True,
            "data": {"id": "org-123", "name": "Acme Corp"}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.create_organization("Acme Corp")

            assert result["success"] is True
            assert result["data"]["name"] == "Acme Corp"
            mock_client.post.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organization",
                data={"name": "Acme Corp"}
            )

    @pytest.mark.asyncio
    async def test_create_organization_with_features(self):
        mock_response = {"success": True, "data": {"id": "org-123", "name": "Acme Corp"}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            features = {"maxUsers": 25, "hasTDAI": True}
            result = await TurboPartner.create_organization(
                "Acme Corp", features=features
            )

            call_data = mock_client.post.call_args[1]["data"]
            assert call_data["features"] == features

    @pytest.mark.asyncio
    async def test_create_organization_with_metadata(self):
        mock_response = {"success": True, "data": {"id": "org-123"}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            metadata = {"industry": "tech", "tier": "premium"}
            await TurboPartner.create_organization("Acme", metadata=metadata)

            call_data = mock_client.post.call_args[1]["data"]
            assert call_data["metadata"] == metadata


class TestListOrganizations:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_list_organizations(self):
        mock_response = {
            "success": True,
            "data": {"results": [{"id": "org-1"}, {"id": "org-2"}], "totalRecords": 2}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.list_organizations()

            assert result["data"]["totalRecords"] == 2
            mock_client.get.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations"
            )

    @pytest.mark.asyncio
    async def test_list_organizations_with_params(self):
        mock_response = {"success": True, "data": {"results": [], "totalRecords": 0}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            await TurboPartner.list_organizations(limit=10, offset=5, search="acme")

            call_path = mock_client.get.call_args[0][0]
            assert "limit=10" in call_path
            assert "offset=5" in call_path
            assert "search=acme" in call_path


class TestGetOrganizationDetails:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_get_organization_details(self):
        mock_response = {
            "success": True,
            "data": {
                "id": "org-123",
                "name": "Acme Corp",
                "features": {"maxUsers": 25},
                "tracking": {"numUsers": 10}
            }
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.get_organization_details("org-123")

            assert result["data"]["name"] == "Acme Corp"
            assert result["data"]["features"]["maxUsers"] == 25
            mock_client.get.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123"
            )


class TestUpdateOrganizationInfo:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_update_organization_info(self):
        mock_response = {"success": True, "data": {"id": "org-123", "name": "New Name"}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.update_organization_info("org-123", name="New Name")

            assert result["data"]["name"] == "New Name"
            mock_client.patch.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123",
                data={"name": "New Name"}
            )


class TestDeleteOrganization:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_delete_organization(self):
        mock_response = {"success": True, "message": "Organization deleted"}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.delete_organization("org-123")

            assert result["success"] is True
            mock_client.delete.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123"
            )


class TestUpdateOrganizationEntitlements:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_update_entitlements(self):
        mock_response = {
            "success": True,
            "data": {"features": {"maxUsers": 50}, "tracking": {"numUsers": 10}}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            features = {"maxUsers": 50, "hasTDAI": True}
            result = await TurboPartner.update_organization_entitlements(
                "org-123", features=features
            )

            assert result["data"]["features"]["maxUsers"] == 50
            mock_client.patch.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/entitlements",
                data={"features": features}
            )


# =========================================================================
# Organization User Management
# =========================================================================

class TestListOrganizationUsers:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_list_org_users(self):
        mock_response = {
            "success": True,
            "data": {"results": [{"email": "user@acme.com"}], "totalRecords": 1}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.list_organization_users("org-123")

            assert result["data"]["totalRecords"] == 1
            mock_client.get.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/users"
            )

    @pytest.mark.asyncio
    async def test_list_org_users_with_pagination(self):
        mock_response = {"success": True, "data": {"results": [], "totalRecords": 0}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            await TurboPartner.list_organization_users("org-123", limit=5, offset=10)

            call_path = mock_client.get.call_args[0][0]
            assert "limit=5" in call_path
            assert "offset=10" in call_path


class TestAddUserToOrganization:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_add_user_to_org(self):
        mock_response = {
            "success": True,
            "data": {"email": "admin@acme.com", "role": "admin"}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.add_user_to_organization(
                "org-123", email="admin@acme.com", role="admin"
            )

            assert result["data"]["email"] == "admin@acme.com"
            mock_client.post.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/users",
                data={"email": "admin@acme.com", "role": "admin"}
            )


class TestUpdateOrganizationUserRole:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_update_org_user_role(self):
        mock_response = {
            "success": True,
            "data": {"id": "user-1", "role": "member"}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.update_organization_user_role(
                "org-123", "user-1", role="member"
            )

            assert result["data"]["role"] == "member"
            mock_client.patch.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/users/user-1",
                data={"role": "member"}
            )


class TestRemoveUserFromOrganization:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_remove_user_from_org(self):
        mock_response = {"success": True, "message": "User removed"}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.remove_user_from_organization("org-123", "user-1")

            assert result["success"] is True
            mock_client.delete.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/users/user-1"
            )


class TestResendOrganizationInvitationToUser:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_resend_org_invitation(self):
        mock_response = {"success": True, "message": "Invitation resent"}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.resend_organization_invitation_to_user("org-123", "user-1")

            assert result["success"] is True
            mock_client.post.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/users/user-1/resend-invitation"
            )


# =========================================================================
# Organization API Key Management
# =========================================================================

class TestListOrganizationApiKeys:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_list_org_api_keys(self):
        mock_response = {
            "success": True,
            "data": {"results": [{"name": "Production Key"}], "totalRecords": 1}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.list_organization_api_keys("org-123")

            assert result["data"]["totalRecords"] == 1
            mock_client.get.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/apikeys"
            )


class TestCreateOrganizationApiKey:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_create_org_api_key(self):
        mock_response = {
            "success": True,
            "data": {"name": "Prod Key", "key": "TDX-abc123", "role": "admin"},
            "message": "API key created"
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.create_organization_api_key(
                "org-123", name="Prod Key", role="admin"
            )

            assert result["data"]["key"] == "TDX-abc123"
            mock_client.post.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/apikeys",
                data={"name": "Prod Key", "role": "admin"}
            )


class TestUpdateOrganizationApiKey:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_update_org_api_key(self):
        mock_response = {
            "success": True,
            "message": "API key updated",
            "apiKey": {"id": "key-1", "name": "Updated Key", "role": "member"}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.update_organization_api_key(
                "org-123", "key-1", name="Updated Key", role="member"
            )

            assert result["apiKey"]["name"] == "Updated Key"
            mock_client.patch.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/apikeys/key-1",
                data={"name": "Updated Key", "role": "member"}
            )

    @pytest.mark.asyncio
    async def test_update_org_api_key_partial(self):
        """Should only send provided fields"""
        mock_response = {"success": True, "apiKey": {"id": "key-1", "name": "New Name"}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            await TurboPartner.update_organization_api_key("org-123", "key-1", name="New Name")

            call_data = mock_client.patch.call_args[1]["data"]
            assert call_data == {"name": "New Name"}
            assert "role" not in call_data


class TestRevokeOrganizationApiKey:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_revoke_org_api_key(self):
        mock_response = {"success": True, "message": "API key revoked"}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.revoke_organization_api_key("org-123", "key-1")

            assert result["success"] is True
            mock_client.delete.assert_called_once_with(
                f"/partner/{PARTNER_ID}/organizations/org-123/apikeys/key-1"
            )


# =========================================================================
# Partner API Key Management
# =========================================================================

class TestListPartnerApiKeys:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_list_partner_api_keys(self):
        mock_response = {
            "success": True,
            "data": {"results": [{"name": "Monitoring Key"}], "totalRecords": 1}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.list_partner_api_keys()

            assert result["data"]["totalRecords"] == 1
            mock_client.get.assert_called_once_with(
                f"/partner/{PARTNER_ID}/api-keys"
            )


class TestCreatePartnerApiKey:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_create_partner_api_key(self):
        mock_response = {
            "success": True,
            "data": {
                "name": "Read-Only Key",
                "key": "TDXP-new-key",
                "scopes": [SCOPE_ORG_READ, SCOPE_AUDIT_READ]
            },
            "message": "Partner API key created"
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.create_partner_api_key(
                name="Read-Only Key",
                scopes=[SCOPE_ORG_READ, SCOPE_AUDIT_READ],
                description="For monitoring"
            )

            assert result["data"]["key"] == "TDXP-new-key"
            mock_client.post.assert_called_once_with(
                f"/partner/{PARTNER_ID}/api-keys",
                data={
                    "name": "Read-Only Key",
                    "scopes": [SCOPE_ORG_READ, SCOPE_AUDIT_READ],
                    "description": "For monitoring"
                }
            )

    @pytest.mark.asyncio
    async def test_create_partner_api_key_without_description(self):
        mock_response = {"success": True, "data": {"name": "Key", "key": "TDXP-k"}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            await TurboPartner.create_partner_api_key(
                name="Key", scopes=[SCOPE_ORG_READ]
            )

            call_data = mock_client.post.call_args[1]["data"]
            assert "description" not in call_data


class TestUpdatePartnerApiKey:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_update_partner_api_key(self):
        mock_response = {
            "success": True,
            "message": "Updated",
            "apiKey": {"id": "pk-1", "name": "Renamed Key", "scopes": [SCOPE_ORG_READ]}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.update_partner_api_key(
                "pk-1", name="Renamed Key", scopes=[SCOPE_ORG_READ]
            )

            assert result["apiKey"]["name"] == "Renamed Key"
            mock_client.patch.assert_called_once_with(
                f"/partner/{PARTNER_ID}/api-keys/pk-1",
                data={"name": "Renamed Key", "scopes": [SCOPE_ORG_READ]}
            )


class TestRevokePartnerApiKey:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_revoke_partner_api_key(self):
        mock_response = {"success": True, "message": "API key revoked"}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.revoke_partner_api_key("pk-1")

            assert result["success"] is True
            mock_client.delete.assert_called_once_with(
                f"/partner/{PARTNER_ID}/api-keys/pk-1"
            )


# =========================================================================
# Partner Portal User Management
# =========================================================================

class TestListPartnerPortalUsers:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_list_partner_users(self):
        mock_response = {
            "success": True,
            "data": {
                "results": [{"email": "admin@partner.com", "role": "admin"}],
                "totalRecords": 1
            }
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.list_partner_portal_users()

            assert result["data"]["totalRecords"] == 1
            mock_client.get.assert_called_once_with(
                f"/partner/{PARTNER_ID}/users"
            )


class TestAddUserToPartnerPortal:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_add_partner_user(self):
        mock_response = {
            "success": True,
            "data": {"email": "ops@partner.com", "role": "member"}
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.add_user_to_partner_portal(
                email="ops@partner.com",
                role="member",
                permissions={"canManageOrgs": True, "canViewAuditLogs": True}
            )

            assert result["data"]["email"] == "ops@partner.com"
            mock_client.post.assert_called_once_with(
                f"/partner/{PARTNER_ID}/users",
                data={
                    "email": "ops@partner.com",
                    "role": "member",
                    "permissions": {"canManageOrgs": True, "canViewAuditLogs": True}
                }
            )

    @pytest.mark.asyncio
    async def test_add_partner_user_all_permissions_false(self):
        mock_response = {"success": True, "data": {"email": "u@p.com", "role": "admin"}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            perms = {"canManageOrgs": False, "canViewAuditLogs": False}
            await TurboPartner.add_user_to_partner_portal(
                email="u@p.com", role="admin", permissions=perms
            )

            call_data = mock_client.post.call_args[1]["data"]
            assert call_data["permissions"] == perms


class TestUpdatePartnerUserPermissions:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_update_partner_user(self):
        mock_response = {
            "success": True,
            "data": {
                "userId": "pu-1",
                "role": "admin",
                "permissions": {"canManageOrgs": True}
            }
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.update_partner_user_permissions(
                "pu-1",
                role="admin",
                permissions={"canManageOrgs": True}
            )

            assert result["data"]["role"] == "admin"
            mock_client.patch.assert_called_once_with(
                f"/partner/{PARTNER_ID}/users/pu-1",
                data={"role": "admin", "permissions": {"canManageOrgs": True}}
            )


class TestRemoveUserFromPartnerPortal:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_remove_partner_user(self):
        mock_response = {"success": True, "message": "User removed"}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.remove_user_from_partner_portal("pu-1")

            assert result["success"] is True
            mock_client.delete.assert_called_once_with(
                f"/partner/{PARTNER_ID}/users/pu-1"
            )


class TestResendPartnerPortalInvitationToUser:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_resend_partner_invitation(self):
        mock_response = {"success": True, "message": "Invitation resent"}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.resend_partner_portal_invitation_to_user("pu-1")

            assert result["success"] is True
            mock_client.post.assert_called_once_with(
                f"/partner/{PARTNER_ID}/users/pu-1/resend-invitation"
            )


# =========================================================================
# Audit Logs
# =========================================================================

class TestGetPartnerAuditLogs:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_get_audit_logs(self):
        mock_response = {
            "success": True,
            "data": {
                "results": [
                    {
                        "id": "log-1",
                        "action": "org.create",
                        "resourceType": "organization",
                        "success": True,
                        "createdOn": "2026-01-01T00:00:00Z"
                    }
                ],
                "totalRecords": 1
            }
        }

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            result = await TurboPartner.get_partner_audit_logs(limit=5)

            assert result["data"]["totalRecords"] == 1
            call_path = mock_client.get.call_args[0][0]
            assert "limit=5" in call_path
            assert "/audit-logs" in call_path

    @pytest.mark.asyncio
    async def test_get_audit_logs_with_filters(self):
        mock_response = {"success": True, "data": {"results": [], "totalRecords": 0}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            await TurboPartner.get_partner_audit_logs(
                action="org.create",
                resource_type="organization",
                success=True,
                start_date="2026-01-01",
                end_date="2026-01-31"
            )

            call_path = mock_client.get.call_args[0][0]
            assert "action=org.create" in call_path
            assert "resourceType=organization" in call_path
            assert "success=true" in call_path
            assert "startDate=2026-01-01" in call_path
            assert "endDate=2026-01-31" in call_path

    @pytest.mark.asyncio
    async def test_get_audit_logs_no_params(self):
        mock_response = {"success": True, "data": {"results": [], "totalRecords": 0}}

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            await TurboPartner.get_partner_audit_logs()

            mock_client.get.assert_called_once_with(
                f"/partner/{PARTNER_ID}/audit-logs"
            )


# =========================================================================
# Error Handling
# =========================================================================

class TestTurboPartnerErrorHandling:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None

    @pytest.mark.asyncio
    async def test_raises_when_not_configured(self):
        with pytest.raises(RuntimeError, match="not configured"):
            await TurboPartner.list_organizations()

    @pytest.mark.asyncio
    async def test_propagates_api_errors(self):
        from turbodocx_sdk import NotFoundError

        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(
                side_effect=NotFoundError("Organization not found", 404)
            )
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            with pytest.raises(NotFoundError, match="Organization not found"):
                await TurboPartner.get_organization_details("invalid-org")

    @pytest.mark.asyncio
    async def test_propagates_auth_errors(self):
        with patch.object(TurboPartner, '_get_client') as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(
                side_effect=AuthenticationError("Invalid partner API key", 401)
            )
            mock_get.return_value = mock_client
            TurboPartner._partner_id = PARTNER_ID

            with pytest.raises(AuthenticationError, match="Invalid partner API key"):
                await TurboPartner.list_organizations()
