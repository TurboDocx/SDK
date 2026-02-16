"""
HTTP client for TurboDocx API
"""

import os
from typing import Any, Dict, Optional, Tuple, Union

import httpx


def detect_file_type(file_bytes: bytes) -> Tuple[str, str]:
    """
    Detect file type from magic bytes.

    Args:
        file_bytes: File content as bytes

    Returns:
        Tuple of (mimetype, extension)
    """
    if len(file_bytes) < 4:
        return ("application/octet-stream", "bin")

    # PDF: %PDF (0x25 0x50 0x44 0x46)
    if file_bytes[0:4] == b'%PDF':
        return ("application/pdf", "pdf")

    # ZIP-based formats (DOCX, PPTX): starts with PK (0x50 0x4B)
    if file_bytes[0:2] == b'PK':
        # Check first 2000 bytes for internal markers
        header = file_bytes[:min(len(file_bytes), 2000)]
        header_str = header.decode('utf-8', errors='ignore')

        # PPTX contains 'ppt/' in the ZIP structure
        if 'ppt/' in header_str:
            return (
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "pptx"
            )

        # DOCX contains 'word/' in the ZIP structure
        if 'word/' in header_str:
            return (
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "docx"
            )

        # Default to DOCX for unknown ZIP
        return (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "docx"
        )

    # Unknown file type
    return ("application/octet-stream", "bin")


class TurboDocxError(Exception):
    """Base exception for TurboDocx API errors"""

    def __init__(self, message: str, status_code: Optional[int] = None, code: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code


class AuthenticationError(TurboDocxError):
    """Raised when authentication fails (HTTP 401)"""
    pass


class ValidationError(TurboDocxError):
    """Raised when validation fails (HTTP 400)"""
    pass


class NotFoundError(TurboDocxError):
    """Raised when resource is not found (HTTP 404)"""
    pass


class RateLimitError(TurboDocxError):
    """Raised when rate limit is exceeded (HTTP 429)"""
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
        base_url: Optional[str] = None,
        org_id: Optional[str] = None,
        sender_email: Optional[str] = None,
        sender_name: Optional[str] = None
    ):
        """
        Initialize HTTP client

        Args:
            api_key: TurboDocx API key (required)
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API (optional, defaults to https://api.turbodocx.com)
            org_id: Organization ID (required)
            sender_email: Reply-to email address for signature requests (required).
                         This email will be used as the reply-to address when sending
                         signature request emails. Without it, emails will default to
                         "API Service User via TurboSign".
            sender_name: Sender name for signature requests (optional but strongly recommended).
                        This name will appear in signature request emails. Without this,
                        the sender will appear as "API Service User".
        """
        self.api_key = api_key or os.environ.get("TURBODOCX_API_KEY")
        self.access_token = access_token
        self.base_url = base_url or os.environ.get("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
        self.org_id = org_id or os.environ.get("TURBODOCX_ORG_ID")
        self.sender_email = sender_email or os.environ.get("TURBODOCX_SENDER_EMAIL")
        self.sender_name = sender_name or os.environ.get("TURBODOCX_SENDER_NAME")

        if not self.api_key and not self.access_token:
            raise AuthenticationError("API key or access token is required")

        if not self.org_id:
            raise AuthenticationError("Organization ID (org_id) is required for authentication")

        if not self.sender_email:
            raise ValidationError(
                "sender_email is required. This email will be used as the reply-to address "
                "for signature requests. Without it, emails will default to "
                '"API Service User via TurboSign".'
            )

    def get_sender_config(self) -> Dict[str, Optional[str]]:
        """
        Get sender email and name configuration

        Returns:
            Dictionary with sender_email and sender_name
        """
        return {
            "sender_email": self.sender_email,
            "sender_name": self.sender_name,
        }

    def _get_headers(self, include_content_type: bool = True) -> Dict[str, str]:
        """Get default headers for requests"""
        headers: Dict[str, str] = {}

        if include_content_type:
            headers["Content-Type"] = "application/json"

        # API key is sent as Bearer token (backend expects Authorization header)
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        elif self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        # Organization ID header (required by backend)
        if self.org_id:
            headers["x-rapiddocx-org-id"] = self.org_id

        return headers

    def _smart_unwrap(self, data: Any) -> Any:
        """
        Smart unwrap response data.
        If response has ONLY "data" key, extract it.
        This handles backend responses that wrap data in { "data": { ... } }
        """
        if isinstance(data, dict) and list(data.keys()) == ["data"]:
            return data["data"]
        return data

    async def _handle_error_response(self, response: httpx.Response) -> None:
        """Handle error response from API"""
        error_message = f"HTTP {response.status_code}: {response.reason_phrase}"
        error_code: Optional[str] = None

        try:
            error_data = response.json()
            error_message = error_data.get("message") or error_data.get("error") or error_message
            error_code = error_data.get("code")
        except Exception:
            # Response body is not valid JSON; fall back to default error message
            pass

        if response.status_code == 400:
            raise ValidationError(error_message, response.status_code, error_code)
        if response.status_code == 401:
            raise AuthenticationError(error_message, response.status_code, error_code)
        if response.status_code == 404:
            raise NotFoundError(error_message, response.status_code, error_code)
        if response.status_code == 429:
            raise RateLimitError(error_message, response.status_code, error_code)

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

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.get(url, headers=headers)

                if not response.is_success:
                    await self._handle_error_response(response)

                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    return self._smart_unwrap(response.json())

                return response.content
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}")
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}")
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}")

    async def post(self, path: str, data: Optional[Dict[str, Any]] = None) -> Any:
        """
        Make POST request to API

        Args:
            path: API endpoint path
            data: Request body data (will be sent as JSON)

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(url, headers=headers, json=data)

                if not response.is_success:
                    await self._handle_error_response(response)

                return self._smart_unwrap(response.json())
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}")
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}")
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}")

    async def patch(self, path: str, data: Optional[Dict[str, Any]] = None) -> Any:
        """
        Make PATCH request to API

        Args:
            path: API endpoint path
            data: Request body data (will be sent as JSON)

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.patch(url, headers=headers, json=data)

                if not response.is_success:
                    await self._handle_error_response(response)

                return self._smart_unwrap(response.json())
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}")
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}")
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}")

    async def delete(self, path: str) -> Any:
        """
        Make DELETE request to API

        Args:
            path: API endpoint path

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.delete(url, headers=headers)

                if not response.is_success:
                    await self._handle_error_response(response)

                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    return self._smart_unwrap(response.json())

                return response.content
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}")
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}")
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}")

    async def upload_file(
        self,
        path: str,
        file: Union[str, bytes],
        file_name: Optional[str] = None,
        field_name: str = "file",
        additional_data: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Upload file to API

        Args:
            path: API endpoint path
            file: File path (str) or file content (bytes)
            file_name: Name of the file (auto-detected for file paths)
            field_name: Form field name for file
            additional_data: Additional form data

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers(include_content_type=False)

        # Handle file path vs bytes
        if isinstance(file, str):
            # File path - read from disk
            with open(file, 'rb') as f:
                file_bytes = f.read()
            if file_name is None:
                file_name = os.path.basename(file)
        else:
            # Bytes - use directly
            file_bytes = file
            if file_name is None:
                # Detect extension from content
                _, ext = detect_file_type(file_bytes)
                file_name = f"document.{ext}"

        # Detect MIME type from content
        mime_type, _ = detect_file_type(file_bytes)

        files = {field_name: (file_name, file_bytes, mime_type)}
        data = additional_data or {}

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, headers=headers, files=files, data=data)

                if not response.is_success:
                    await self._handle_error_response(response)

                return self._smart_unwrap(response.json())
            except (httpx.NetworkError, httpx.TimeoutException) as e:
                raise NetworkError(f"File upload failed: {str(e) or 'Connection error'}")
            except Exception as e:
                raise NetworkError(f"File upload failed: {str(e) or 'Unknown error'}")


class PartnerHttpClient:
    """HTTP client for TurboDocx Partner API

    Uses partner-specific authentication (Partner API Key + Partner ID)
    instead of the standard API key + Org ID used by HttpClient.
    """

    def __init__(
        self,
        partner_api_key: Optional[str] = None,
        partner_id: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.partner_api_key = partner_api_key or os.environ.get("TURBODOCX_PARTNER_API_KEY")
        self.partner_id = partner_id or os.environ.get("TURBODOCX_PARTNER_ID")
        self.base_url = base_url or os.environ.get("TURBODOCX_BASE_URL", "https://api.turbodocx.com")

        if not self.partner_api_key:
            raise AuthenticationError("Partner API key is required")

        if not self.partner_id:
            raise AuthenticationError("Partner ID is required")

    def _get_headers(self) -> Dict[str, str]:
        """Get default headers for partner requests"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.partner_api_key}",
        }

    async def _handle_error_response(self, response: httpx.Response) -> None:
        """Handle error response from API"""
        error_message = f"HTTP {response.status_code}: {response.reason_phrase}"
        error_code: Optional[str] = None

        try:
            error_data = response.json()
            error_message = error_data.get("message") or error_data.get("error") or error_message
            error_code = error_data.get("code")
        except Exception:
            # Response body is not valid JSON; fall back to default error message
            pass

        if response.status_code == 400:
            raise ValidationError(error_message, response.status_code, error_code)
        if response.status_code == 401:
            raise AuthenticationError(error_message, response.status_code, error_code)
        if response.status_code == 404:
            raise NotFoundError(error_message, response.status_code, error_code)
        if response.status_code == 429:
            raise RateLimitError(error_message, response.status_code, error_code)

        raise TurboDocxError(error_message, response.status_code, error_code)

    async def get(self, path: str) -> Any:
        """Make GET request to Partner API"""
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.get(url, headers=headers)

                if not response.is_success:
                    await self._handle_error_response(response)

                return response.json()
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}")
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}")
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}")

    async def post(self, path: str, data: Optional[Dict[str, Any]] = None) -> Any:
        """Make POST request to Partner API"""
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(url, headers=headers, json=data)

                if not response.is_success:
                    await self._handle_error_response(response)

                return response.json()
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}")
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}")
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}")

    async def patch(self, path: str, data: Optional[Dict[str, Any]] = None) -> Any:
        """Make PATCH request to Partner API"""
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.patch(url, headers=headers, json=data)

                if not response.is_success:
                    await self._handle_error_response(response)

                return response.json()
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}")
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}")
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}")

    async def delete(self, path: str) -> Any:
        """Make DELETE request to Partner API"""
        url = f"{self.base_url}{path}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.delete(url, headers=headers)

                if not response.is_success:
                    await self._handle_error_response(response)

                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    return response.json()

                return response.content
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}")
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}")
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}")
