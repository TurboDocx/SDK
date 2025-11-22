"""
HTTP client for TurboDocx API
"""

import os
from typing import Any, Dict, Optional

import httpx


class TurboDocxError(Exception):
    """Base exception for TurboDocx API errors"""

    def __init__(self, message: str, status_code: Optional[int] = None, code: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


class AuthenticationError(TurboDocxError):
    """Raised when authentication fails"""
    pass


class NetworkError(TurboDocxError):
    """Raised when network request fails"""
    pass


class HttpClient:
    """HTTP client for TurboDocx API"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        """
        Initialize HTTP client

        Args:
            api_key: TurboDocx API key
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API
        """
        self.api_key = api_key or os.environ.get("TURBODOCX_API_KEY")
        self.access_token = access_token
        self.base_url = base_url or os.environ.get("TURBODOCX_BASE_URL", "https://api.turbodocx.com")

        if not self.api_key and not self.access_token:
            raise AuthenticationError("API key or access token is required")

    def _get_headers(self, include_content_type: bool = True) -> Dict[str, str]:
        """Get default headers for requests"""
        headers: Dict[str, str] = {}

        if include_content_type:
            headers["Content-Type"] = "application/json"

        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        elif self.api_key:
            headers["X-API-Key"] = self.api_key

        return headers

    async def _handle_error_response(self, response: httpx.Response) -> None:
        """Handle error response from API"""
        error_message = f"HTTP {response.status_code}: {response.reason_phrase}"
        error_code: Optional[str] = None

        try:
            error_data = response.json()
            error_message = error_data.get("message") or error_data.get("error") or error_message
            error_code = error_data.get("code")
        except Exception:
            pass

        if response.status_code == 401:
            raise AuthenticationError(error_message)

        raise TurboDocxError(error_message, response.status_code, error_code)

    async def get(self, path: str) -> Any:
        """
        Make GET request to API

        Args:
            path: API endpoint path

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers)

                if not response.is_success:
                    await self._handle_error_response(response)

                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    return response.json()

                return response.content
            except (httpx.NetworkError, httpx.TimeoutException) as e:
                raise NetworkError(f"Network request failed: {e}")

    async def post(self, path: str, data: Optional[Dict[str, Any]] = None) -> Any:
        """
        Make POST request to API

        Args:
            path: API endpoint path
            data: Request body data

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=data)

                if not response.is_success:
                    await self._handle_error_response(response)

                return response.json()
            except (httpx.NetworkError, httpx.TimeoutException) as e:
                raise NetworkError(f"Network request failed: {e}")

    async def upload_file(
        self,
        path: str,
        file: bytes,
        file_name: str = "file",
        field_name: str = "file",
        additional_data: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Upload file to API

        Args:
            path: API endpoint path
            file: File content as bytes
            file_name: Name of the file
            field_name: Form field name for file
            additional_data: Additional form data

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers(include_content_type=False)

        files = {field_name: (file_name, file, "application/pdf")}
        data = additional_data or {}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, files=files, data=data)

                if not response.is_success:
                    await self._handle_error_response(response)

                return response.json()
            except (httpx.NetworkError, httpx.TimeoutException) as e:
                raise NetworkError(f"File upload failed: {e}")
