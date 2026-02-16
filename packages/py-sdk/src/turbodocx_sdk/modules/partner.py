"""
TurboPartner Module - Partner portal management operations

Provides partner-level management for multi-tenant applications:
- Organization management (CRUD, entitlements)
- Organization user management
- Organization API key management
- Partner API key management
- Partner portal user management
- Audit logs
"""

from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

from ..http import PartnerHttpClient


# --- Scope Constants ---

SCOPE_ORG_CREATE = "org:create"
SCOPE_ORG_READ = "org:read"
SCOPE_ORG_UPDATE = "org:update"
SCOPE_ORG_DELETE = "org:delete"
SCOPE_ENTITLEMENTS_UPDATE = "entitlements:update"
SCOPE_ORG_USERS_CREATE = "org-users:create"
SCOPE_ORG_USERS_READ = "org-users:read"
SCOPE_ORG_USERS_UPDATE = "org-users:update"
SCOPE_ORG_USERS_DELETE = "org-users:delete"
SCOPE_PARTNER_USERS_CREATE = "partner-users:create"
SCOPE_PARTNER_USERS_READ = "partner-users:read"
SCOPE_PARTNER_USERS_UPDATE = "partner-users:update"
SCOPE_PARTNER_USERS_DELETE = "partner-users:delete"
SCOPE_ORG_APIKEYS_CREATE = "org-apikeys:create"
SCOPE_ORG_APIKEYS_READ = "org-apikeys:read"
SCOPE_ORG_APIKEYS_UPDATE = "org-apikeys:update"
SCOPE_ORG_APIKEYS_DELETE = "org-apikeys:delete"
SCOPE_PARTNER_APIKEYS_CREATE = "partner-apikeys:create"
SCOPE_PARTNER_APIKEYS_READ = "partner-apikeys:read"
SCOPE_PARTNER_APIKEYS_UPDATE = "partner-apikeys:update"
SCOPE_PARTNER_APIKEYS_DELETE = "partner-apikeys:delete"
SCOPE_AUDIT_READ = "audit:read"


def _build_query_string(params: Dict[str, Any]) -> str:
    """Build URL query string from non-None parameters"""
    filtered = {k: v for k, v in params.items() if v is not None}
    if not filtered:
        return ""
    # Convert booleans to lowercase strings for URL params
    for k, v in filtered.items():
        if isinstance(v, bool):
            filtered[k] = str(v).lower()
    return "?" + urlencode(filtered)


class TurboPartner:
    """TurboPartner module for partner portal management operations"""

    _client: Optional[PartnerHttpClient] = None
    _partner_id: Optional[str] = None

    @classmethod
    def configure(
        cls,
        partner_api_key: Optional[str] = None,
        partner_id: Optional[str] = None,
        base_url: str = "https://api.turbodocx.com"
    ) -> None:
        """
        Configure the TurboPartner module with partner API credentials

        Args:
            partner_api_key: Partner API key (starts with TDXP-)
            partner_id: Partner UUID
            base_url: Base URL for the API (optional)

        Example:
            >>> TurboPartner.configure(
            ...     partner_api_key=os.environ.get("TURBODOCX_PARTNER_API_KEY"),
            ...     partner_id=os.environ.get("TURBODOCX_PARTNER_ID")
            ... )
        """
        cls._client = PartnerHttpClient(
            partner_api_key=partner_api_key,
            partner_id=partner_id,
            base_url=base_url
        )
        cls._partner_id = cls._client.partner_id

    @classmethod
    def _get_client(cls) -> PartnerHttpClient:
        """Get the HTTP client instance, raising error if not configured"""
        if cls._client is None:
            raise RuntimeError(
                "TurboPartner not configured. Call TurboPartner.configure("
                "partner_api_key='...', partner_id='...') first."
            )
        return cls._client

    @classmethod
    def _base_path(cls) -> str:
        """Get the base path for partner API endpoints"""
        return f"/partner/{cls._partner_id}"

    # =========================================================================
    # Organization Management
    # =========================================================================

    @classmethod
    async def create_organization(
        cls,
        name: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        features: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new organization under the partner account

        Args:
            name: Organization name (required)
            metadata: Optional metadata key-value pairs
            features: Optional entitlement configuration (max_users, max_storage, etc.)

        Returns:
            Dict with success and data (organization details)
        """
        client = cls._get_client()
        body: Dict[str, Any] = {"name": name}
        if metadata is not None:
            body["metadata"] = metadata
        if features is not None:
            body["features"] = features
        return await client.post(f"{cls._base_path()}/organization", data=body)

    @classmethod
    async def list_organizations(
        cls,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List all organizations under the partner account

        Args:
            limit: Maximum number of results
            offset: Pagination offset
            search: Search query string

        Returns:
            Dict with success and data (results, totalRecords, limit, offset)
        """
        client = cls._get_client()
        qs = _build_query_string({"limit": limit, "offset": offset, "search": search})
        return await client.get(f"{cls._base_path()}/organizations{qs}")

    @classmethod
    async def get_organization_details(cls, organization_id: str) -> Dict[str, Any]:
        """
        Get full organization details including features and tracking

        Args:
            organization_id: Organization UUID

        Returns:
            Dict with success and data (organization info, features, tracking)
        """
        client = cls._get_client()
        return await client.get(f"{cls._base_path()}/organizations/{organization_id}")

    @classmethod
    async def update_organization_info(
        cls,
        organization_id: str,
        *,
        name: str
    ) -> Dict[str, Any]:
        """
        Update organization information

        Args:
            organization_id: Organization UUID
            name: New organization name

        Returns:
            Dict with success and data (updated organization)
        """
        client = cls._get_client()
        return await client.patch(
            f"{cls._base_path()}/organizations/{organization_id}",
            data={"name": name}
        )

    @classmethod
    async def delete_organization(cls, organization_id: str) -> Dict[str, Any]:
        """
        Delete an organization

        Args:
            organization_id: Organization UUID

        Returns:
            Dict with success and message
        """
        client = cls._get_client()
        return await client.delete(f"{cls._base_path()}/organizations/{organization_id}")

    @classmethod
    async def update_organization_entitlements(
        cls,
        organization_id: str,
        *,
        features: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Update organization entitlements (feature limits and capabilities)

        Args:
            organization_id: Organization UUID
            features: Feature configuration dict with keys like:
                max_users, max_storage, max_templates, max_signatures,
                max_ai_credits, has_tdai, has_pptx, has_file_download, etc.

        Returns:
            Dict with success and data (features, tracking)
        """
        client = cls._get_client()
        body: Dict[str, Any] = {}
        if features is not None:
            body["features"] = features
        return await client.patch(
            f"{cls._base_path()}/organizations/{organization_id}/entitlements",
            data=body
        )

    # =========================================================================
    # Organization User Management
    # =========================================================================

    @classmethod
    async def list_organization_users(
        cls,
        organization_id: str,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List users in an organization

        Args:
            organization_id: Organization UUID
            limit: Maximum number of results
            offset: Pagination offset
            search: Search query string

        Returns:
            Dict with success and data (results, totalRecords, limit, offset)
        """
        client = cls._get_client()
        qs = _build_query_string({"limit": limit, "offset": offset, "search": search})
        return await client.get(
            f"{cls._base_path()}/organizations/{organization_id}/users{qs}"
        )

    @classmethod
    async def add_user_to_organization(
        cls,
        organization_id: str,
        *,
        email: str,
        role: str
    ) -> Dict[str, Any]:
        """
        Add a user to an organization

        Args:
            organization_id: Organization UUID
            email: User email address
            role: User role ("admin" or "member")

        Returns:
            Dict with success and data (user details)
        """
        client = cls._get_client()
        return await client.post(
            f"{cls._base_path()}/organizations/{organization_id}/users",
            data={"email": email, "role": role}
        )

    @classmethod
    async def update_organization_user_role(
        cls,
        organization_id: str,
        user_id: str,
        *,
        role: str
    ) -> Dict[str, Any]:
        """
        Update a user's role in an organization

        Args:
            organization_id: Organization UUID
            user_id: User UUID
            role: New role ("admin" or "member")

        Returns:
            Dict with success and data (updated user)
        """
        client = cls._get_client()
        return await client.patch(
            f"{cls._base_path()}/organizations/{organization_id}/users/{user_id}",
            data={"role": role}
        )

    @classmethod
    async def remove_user_from_organization(
        cls,
        organization_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Remove a user from an organization

        Args:
            organization_id: Organization UUID
            user_id: User UUID

        Returns:
            Dict with success and message
        """
        client = cls._get_client()
        return await client.delete(
            f"{cls._base_path()}/organizations/{organization_id}/users/{user_id}"
        )

    @classmethod
    async def resend_organization_invitation_to_user(
        cls,
        organization_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Resend invitation email to a user in an organization

        Args:
            organization_id: Organization UUID
            user_id: User UUID

        Returns:
            Dict with success and message
        """
        client = cls._get_client()
        return await client.post(
            f"{cls._base_path()}/organizations/{organization_id}/users/{user_id}/resend-invitation"
        )

    # =========================================================================
    # Organization API Key Management
    # =========================================================================

    @classmethod
    async def list_organization_api_keys(
        cls,
        organization_id: str,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List API keys for an organization

        Args:
            organization_id: Organization UUID
            limit: Maximum number of results
            offset: Pagination offset
            search: Search query string

        Returns:
            Dict with success and data (results, totalRecords, limit, offset)
        """
        client = cls._get_client()
        qs = _build_query_string({"limit": limit, "offset": offset, "search": search})
        return await client.get(
            f"{cls._base_path()}/organizations/{organization_id}/apikeys{qs}"
        )

    @classmethod
    async def create_organization_api_key(
        cls,
        organization_id: str,
        *,
        name: str,
        role: str
    ) -> Dict[str, Any]:
        """
        Create an API key for an organization

        Args:
            organization_id: Organization UUID
            name: API key name
            role: API key role ("admin" or "member")

        Returns:
            Dict with success, data (key details including the key value), and message
        """
        client = cls._get_client()
        return await client.post(
            f"{cls._base_path()}/organizations/{organization_id}/apikeys",
            data={"name": name, "role": role}
        )

    @classmethod
    async def update_organization_api_key(
        cls,
        organization_id: str,
        api_key_id: str,
        *,
        name: Optional[str] = None,
        role: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update an organization API key

        Args:
            organization_id: Organization UUID
            api_key_id: API key UUID
            name: New API key name
            role: New API key role

        Returns:
            Dict with success, message, and apiKey (updated key details)
        """
        client = cls._get_client()
        body: Dict[str, Any] = {}
        if name is not None:
            body["name"] = name
        if role is not None:
            body["role"] = role
        return await client.patch(
            f"{cls._base_path()}/organizations/{organization_id}/apikeys/{api_key_id}",
            data=body
        )

    @classmethod
    async def revoke_organization_api_key(
        cls,
        organization_id: str,
        api_key_id: str
    ) -> Dict[str, Any]:
        """
        Revoke (delete) an organization API key

        Args:
            organization_id: Organization UUID
            api_key_id: API key UUID

        Returns:
            Dict with success and message
        """
        client = cls._get_client()
        return await client.delete(
            f"{cls._base_path()}/organizations/{organization_id}/apikeys/{api_key_id}"
        )

    # =========================================================================
    # Partner API Key Management
    # =========================================================================

    @classmethod
    async def list_partner_api_keys(
        cls,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List partner-level API keys

        Args:
            limit: Maximum number of results
            offset: Pagination offset
            search: Search query string

        Returns:
            Dict with success and data (results, totalRecords, limit, offset)
        """
        client = cls._get_client()
        qs = _build_query_string({"limit": limit, "offset": offset, "search": search})
        return await client.get(f"{cls._base_path()}/api-keys{qs}")

    @classmethod
    async def create_partner_api_key(
        cls,
        *,
        name: str,
        scopes: List[str],
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a partner-level API key with scoped permissions

        Args:
            name: API key name
            scopes: List of permission scopes (use SCOPE_* constants)
            description: Optional description

        Returns:
            Dict with success, data (key details including the key value), and message
        """
        client = cls._get_client()
        body: Dict[str, Any] = {"name": name, "scopes": scopes}
        if description is not None:
            body["description"] = description
        return await client.post(f"{cls._base_path()}/api-keys", data=body)

    @classmethod
    async def update_partner_api_key(
        cls,
        key_id: str,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        scopes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Update a partner API key

        Args:
            key_id: API key UUID
            name: New name
            description: New description
            scopes: New scopes list

        Returns:
            Dict with success, message, and apiKey (updated key details)
        """
        client = cls._get_client()
        body: Dict[str, Any] = {}
        if name is not None:
            body["name"] = name
        if description is not None:
            body["description"] = description
        if scopes is not None:
            body["scopes"] = scopes
        return await client.patch(f"{cls._base_path()}/api-keys/{key_id}", data=body)

    @classmethod
    async def revoke_partner_api_key(cls, key_id: str) -> Dict[str, Any]:
        """
        Revoke (delete) a partner API key

        Args:
            key_id: API key UUID

        Returns:
            Dict with success and message
        """
        client = cls._get_client()
        return await client.delete(f"{cls._base_path()}/api-keys/{key_id}")

    # =========================================================================
    # Partner Portal User Management
    # =========================================================================

    @classmethod
    async def list_partner_portal_users(
        cls,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List users in the partner portal

        Args:
            limit: Maximum number of results
            offset: Pagination offset
            search: Search query string

        Returns:
            Dict with success and data (results, totalRecords, limit, offset)
        """
        client = cls._get_client()
        qs = _build_query_string({"limit": limit, "offset": offset, "search": search})
        return await client.get(f"{cls._base_path()}/users{qs}")

    @classmethod
    async def add_user_to_partner_portal(
        cls,
        *,
        email: str,
        role: str,
        permissions: Dict[str, bool]
    ) -> Dict[str, Any]:
        """
        Add a user to the partner portal

        Args:
            email: User email address
            role: User role ("admin" or "member")
            permissions: Permission flags dict with camelCase keys:
                canManageOrgs, canManageOrgUsers, canManagePartnerUsers,
                canManageOrgAPIKeys, canManagePartnerAPIKeys,
                canUpdateEntitlements, canViewAuditLogs

        Returns:
            Dict with success and data (user details)
        """
        client = cls._get_client()
        body: Dict[str, Any] = {"email": email, "role": role, "permissions": permissions}
        return await client.post(f"{cls._base_path()}/users", data=body)

    @classmethod
    async def update_partner_user_permissions(
        cls,
        user_id: str,
        *,
        role: Optional[str] = None,
        permissions: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """
        Update a partner portal user's role and/or permissions

        Args:
            user_id: User UUID
            role: New role
            permissions: New permission flags

        Returns:
            Dict with success and data (userId, role, permissions)
        """
        client = cls._get_client()
        body: Dict[str, Any] = {}
        if role is not None:
            body["role"] = role
        if permissions is not None:
            body["permissions"] = permissions
        return await client.patch(f"{cls._base_path()}/users/{user_id}", data=body)

    @classmethod
    async def remove_user_from_partner_portal(cls, user_id: str) -> Dict[str, Any]:
        """
        Remove a user from the partner portal

        Args:
            user_id: User UUID

        Returns:
            Dict with success and message
        """
        client = cls._get_client()
        return await client.delete(f"{cls._base_path()}/users/{user_id}")

    @classmethod
    async def resend_partner_portal_invitation_to_user(cls, user_id: str) -> Dict[str, Any]:
        """
        Resend partner portal invitation email to a user

        Args:
            user_id: User UUID

        Returns:
            Dict with success and message
        """
        client = cls._get_client()
        return await client.post(f"{cls._base_path()}/users/{user_id}/resend-invitation")

    # =========================================================================
    # Audit Logs
    # =========================================================================

    @classmethod
    async def get_partner_audit_logs(
        cls,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        search: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        success: Optional[bool] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get partner audit logs with optional filtering

        Args:
            limit: Maximum number of results
            offset: Pagination offset
            search: Search query string
            action: Filter by action type
            resource_type: Filter by resource type
            resource_id: Filter by resource ID
            success: Filter by success status
            start_date: Filter from date (ISO 8601)
            end_date: Filter to date (ISO 8601)

        Returns:
            Dict with success and data (results, totalRecords, limit, offset)
        """
        client = cls._get_client()
        qs = _build_query_string({
            "limit": limit,
            "offset": offset,
            "search": search,
            "action": action,
            "resourceType": resource_type,
            "resourceId": resource_id,
            "success": success,
            "startDate": start_date,
            "endDate": end_date,
        })
        return await client.get(f"{cls._base_path()}/audit-logs{qs}")
