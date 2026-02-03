"""
TurboDocx Python SDK

Official SDK for TurboDocx API - Digital signatures, document generation,
and AI-powered workflows.
"""

__version__ = "0.1.0"

from typing import Optional

from .modules.sign import TurboSign
from .modules.template import TurboTemplate
from .http import (
    HttpClient,
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
    "TurboTemplate",
    "HttpClient",
    "TurboDocxError",
    "AuthenticationError",
    "ValidationError",
    "NotFoundError",
    "RateLimitError",
    "NetworkError",
    "__version__",
]
