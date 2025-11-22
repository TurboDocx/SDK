"""
TurboDocx Python SDK

Official SDK for TurboDocx API - Digital signatures, document generation,
and AI-powered workflows.
"""

__version__ = "0.1.0"

from typing import Optional

from .modules.sign import TurboSign
from .http import HttpClient, TurboDocxError, AuthenticationError, NetworkError


class TurboDocxClient:
    """Main client for interacting with TurboDocx API"""

    def __init__(self, api_key: str, base_url: str = "https://api.turbodocx.com"):
        """
        Initialize TurboDocx client

        Args:
            api_key: Your TurboDocx API key
            base_url: Base URL for the API (default: https://api.turbodocx.com)
        """
        self.api_key = api_key
        self.base_url = base_url

        # Configure TurboSign module
        TurboSign.configure(api_key=api_key, base_url=base_url)

    @property
    def sign(self) -> type:
        """Access TurboSign module for digital signature operations"""
        return TurboSign


__all__ = [
    "TurboDocxClient",
    "TurboSign",
    "HttpClient",
    "TurboDocxError",
    "AuthenticationError",
    "NetworkError",
    "__version__",
]
