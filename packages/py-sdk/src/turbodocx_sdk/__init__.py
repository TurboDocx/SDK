"""
TurboDocx Python SDK

Official SDK for TurboDocx API - Digital signatures, document generation,
and AI-powered workflows.
"""

__version__ = "0.2.0"

from typing import Optional

from .modules.sign import TurboSign
from .modules.partner import TurboPartner
from .modules.partner import (
    SCOPE_ORG_CREATE,
    SCOPE_ORG_READ,
    SCOPE_ORG_UPDATE,
    SCOPE_ORG_DELETE,
    SCOPE_ENTITLEMENTS_UPDATE,
    SCOPE_ORG_USERS_CREATE,
    SCOPE_ORG_USERS_READ,
    SCOPE_ORG_USERS_UPDATE,
    SCOPE_ORG_USERS_DELETE,
    SCOPE_PARTNER_USERS_CREATE,
    SCOPE_PARTNER_USERS_READ,
    SCOPE_PARTNER_USERS_UPDATE,
    SCOPE_PARTNER_USERS_DELETE,
    SCOPE_ORG_APIKEYS_CREATE,
    SCOPE_ORG_APIKEYS_READ,
    SCOPE_ORG_APIKEYS_UPDATE,
    SCOPE_ORG_APIKEYS_DELETE,
    SCOPE_PARTNER_APIKEYS_CREATE,
    SCOPE_PARTNER_APIKEYS_READ,
    SCOPE_PARTNER_APIKEYS_UPDATE,
    SCOPE_PARTNER_APIKEYS_DELETE,
    SCOPE_AUDIT_READ,
)
from .http import (
    HttpClient,
    PartnerHttpClient,
    TurboDocxError,
    AuthenticationError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    NetworkError
)


class TurboDocxClient:
    """Main client for interacting with TurboDocx API"""

    def __init__(
        self,
        api_key: str,
        org_id: str,
        base_url: str = "https://api.turbodocx.com"
    ):
        """
        Initialize TurboDocx client

        Args:
            api_key: Your TurboDocx API key
            org_id: Your Organization ID (required for authentication)
            base_url: Base URL for the API (default: https://api.turbodocx.com)
        """
        self.api_key = api_key
        self.org_id = org_id
        self.base_url = base_url

        # Configure TurboSign module
        TurboSign.configure(api_key=api_key, org_id=org_id, base_url=base_url)

    @property
    def sign(self) -> type:
        """Access TurboSign module for digital signature operations"""
        return TurboSign


__all__ = [
    "TurboDocxClient",
    "TurboSign",
    "TurboPartner",
    "HttpClient",
    "PartnerHttpClient",
    "TurboDocxError",
    "AuthenticationError",
    "ValidationError",
    "NotFoundError",
    "RateLimitError",
    "NetworkError",
    "__version__",
    # Scope constants
    "SCOPE_ORG_CREATE",
    "SCOPE_ORG_READ",
    "SCOPE_ORG_UPDATE",
    "SCOPE_ORG_DELETE",
    "SCOPE_ENTITLEMENTS_UPDATE",
    "SCOPE_ORG_USERS_CREATE",
    "SCOPE_ORG_USERS_READ",
    "SCOPE_ORG_USERS_UPDATE",
    "SCOPE_ORG_USERS_DELETE",
    "SCOPE_PARTNER_USERS_CREATE",
    "SCOPE_PARTNER_USERS_READ",
    "SCOPE_PARTNER_USERS_UPDATE",
    "SCOPE_PARTNER_USERS_DELETE",
    "SCOPE_ORG_APIKEYS_CREATE",
    "SCOPE_ORG_APIKEYS_READ",
    "SCOPE_ORG_APIKEYS_UPDATE",
    "SCOPE_ORG_APIKEYS_DELETE",
    "SCOPE_PARTNER_APIKEYS_CREATE",
    "SCOPE_PARTNER_APIKEYS_READ",
    "SCOPE_PARTNER_APIKEYS_UPDATE",
    "SCOPE_PARTNER_APIKEYS_DELETE",
    "SCOPE_AUDIT_READ",
]
