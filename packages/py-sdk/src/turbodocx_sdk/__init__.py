"""
TurboDocx Python SDK

Official SDK for TurboDocx API
"""

__version__ = "0.1.0"

from typing import Optional


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

    def get_status(self) -> dict:
        """
        Placeholder method - will be generated from OpenAPI specs

        Returns:
            dict: Status response
        """
        # Implementation will be generated from API specs
        return {"status": "ok"}


__all__ = ["TurboDocxClient", "__version__"]
