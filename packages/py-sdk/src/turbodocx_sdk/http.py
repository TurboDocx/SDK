"""
HTTP client for TurboDocx API
"""

import json
import os
from typing import Any, Dict, List, Optional, Tuple, Union
from urllib.parse import quote

import httpx

from .utils.client_context import ClientContext, resolve_client_context_headers
from .utils.response_normalizer import normalize_response


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

    # PNG: 0x89 0x50 0x4E 0x47
    if file_bytes[0:4] == b'\x89PNG':
        return ("image/png", "png")

    # JPEG: 0xFF 0xD8 0xFF
    if file_bytes[0:3] == b'\xff\xd8\xff':
        return ("image/jpeg", "jpg")

    # GIF: GIF87a or GIF89a
    if file_bytes[0:3] == b'GIF':
        return ("image/gif", "gif")

    # WebP: RIFF....WEBP
    if file_bytes[0:4] == b'RIFF' and len(file_bytes) >= 12 and file_bytes[8:12] == b'WEBP':
        return ("image/webp", "webp")

    # ZIP-based formats (DOCX, PPTX): starts with PK (0x50 0x4B)
    if file_bytes[0:2] == b'PK':
        header = file_bytes[:min(len(file_bytes), 2000)]
        header_str = header.decode('utf-8', errors='ignore')

        if 'ppt/' in header_str:
            return (
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "pptx"
            )

        if 'word/' in header_str:
            return (
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "docx"
            )

        return (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "docx"
        )

    # Unknown file type
    return ("application/octet-stream", "bin")


def _extract_error(error_data: dict, fallback_message: str) -> tuple:
    """Pull the actionable message and the specific code out of an API error body.

    The API reports failures in several shapes and BOTH HTTP clients (HttpClient and
    PartnerHttpClient) must read all of them identically — this lived as a duplicated block
    in each, so only one copy was covered by tests and they could silently drift.

    message: data.errors[] -> errors[] -> message -> error.message -> error(str) -> fallback
    code:    code -> type -> error.code -> error(str, only alongside a message)

    Returns ``(message, code)``; ``code`` is None when the body carries none, in which case
    the raising error class supplies its own default.
    """
    # Per-field/per-row reasons live under data.errors[] (celebrate/Joi) or a top-level
    # errors[] (bulk). These say what to fix; the envelope message does not.
    details = (error_data.get("data") or {}).get("errors") or error_data.get("errors") or []
    field_errors = [d.get("message") for d in details if isinstance(d, dict) and d.get("message")]

    # `error` may be a nested object ({"message", "code"} — the TurboQuote surface) rather
    # than a string; reading it blindly would stringify the dict.
    raw_error = error_data.get("error")
    nested_message = raw_error.get("message") if isinstance(raw_error, dict) else None
    error_string = raw_error if isinstance(raw_error, str) else None

    message = (
        "; ".join(field_errors)
        or error_data.get("message")
        or nested_message
        or error_string
        or fallback_message
    )

    # The specific reason code, so callers can branch on it (err.code == "QUOTE_NOT_FOUND")
    # rather than only on the HTTP class. It appears in four places depending on the handler:
    # `code`, `type`, nested `error.code`, or `error` as a bare string alongside `message`.
    # That last case is why the string form is only a code when `message` is also present —
    # alone it IS the message.
    nested_code = raw_error.get("code") if isinstance(raw_error, dict) else None
    code = (
        error_data.get("code")
        or error_data.get("type")
        or nested_code
        or (error_string if error_data.get("message") and error_string else None)
    )

    return message, code


class TurboDocxError(Exception):
    """Base exception for TurboDocx API errors"""

    #: Fallback for ``code`` when the API response carries no machine-readable code.
    #: Subclasses override it so ``err.code`` is always populated and callers can branch
    #: on it without a None check. Kept identical across all six SDKs.
    DEFAULT_CODE: Optional[str] = None

    def __init__(self, message: str, status_code: Optional[int] = None, code: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        # An API-supplied code always wins; DEFAULT_CODE only fills the gap.
        self.code = code or self.DEFAULT_CODE


class AuthenticationError(TurboDocxError):
    """Raised when authentication fails (HTTP 401)"""
    DEFAULT_CODE = "AUTHENTICATION_ERROR"


class AuthorizationError(TurboDocxError):
    """Raised when the caller is authenticated but lacks required permissions (HTTP 403)"""
    DEFAULT_CODE = "AUTHORIZATION_ERROR"


class ValidationError(TurboDocxError):
    """Raised when validation fails (HTTP 400)"""
    DEFAULT_CODE = "VALIDATION_ERROR"


class NotFoundError(TurboDocxError):
    """Raised when resource is not found (HTTP 404)"""
    DEFAULT_CODE = "NOT_FOUND"


class ConflictError(TurboDocxError):
    """Raised when a request conflicts with current resource state (HTTP 409)"""
    DEFAULT_CODE = "CONFLICT"


class RateLimitError(TurboDocxError):
    """Raised when rate limit is exceeded (HTTP 429)"""
    DEFAULT_CODE = "RATE_LIMIT_EXCEEDED"


class NetworkError(TurboDocxError):
    """Raised when network request fails"""
    DEFAULT_CODE = "NETWORK_ERROR"


class HttpClient:
    """HTTP client for TurboDocx API"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        base_url: Optional[str] = None,
        org_id: Optional[str] = None,
        sender_email: Optional[str] = None,
        sender_name: Optional[str] = None,
        skip_sender_validation: bool = False,
        client_context: Optional[ClientContext] = None
    ):
        """
        Initialize HTTP client

        Args:
            api_key: TurboDocx API key (required)
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API (optional, defaults to https://api.turbodocx.com)
            org_id: Organization ID (required)
            sender_email: Reply-to email address for signature requests (required).
                         Used as the reply-to address on signature request emails and
                         recorded as the sender in the audit trail. An API key has no
                         mailbox of its own, so the API rejects a send without it rather
                         than mailing from an unmonitored address.
            sender_name: Sender name for signature requests (optional). Appears in
                        signature request emails and the audit trail. Defaults to the
                        name of your API key.
            skip_sender_validation: Skip sender_email validation (used internally by
                                   modules like Deliverable, TurboQuote, and TurboPartner
                                   that don't send signature emails)
        """
        self.api_key = api_key or os.environ.get("TURBODOCX_API_KEY")
        self.access_token = access_token
        self.base_url = base_url or os.environ.get("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
        self.org_id = org_id or os.environ.get("TURBODOCX_ORG_ID")
        self.sender_email = sender_email or os.environ.get("TURBODOCX_SENDER_EMAIL")
        self.sender_name = sender_name or os.environ.get("TURBODOCX_SENDER_NAME")
        # Resolved client-context headers (User-Agent, X-Timezone, ...), computed once.
        self._context_headers = resolve_client_context_headers(client_context)

        if not self.api_key and not self.access_token:
            raise AuthenticationError("API key or access token is required")

        if not self.sender_email and not skip_sender_validation:
            raise ValidationError(
                "sender_email is required. It is used as the reply-to address for signature "
                "requests and recorded as the sender in the audit trail. The API rejects "
                "sends without it."
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
        # Client-context headers (User-Agent, X-Timezone, Accept-Language,
        # X-Forwarded-For, X-Device-Fingerprint) describe the calling environment
        # so the signature audit trail records real device/location. Copy them
        # first so the SDK's own protocol headers always win over caller context.
        headers: Dict[str, str] = dict(self._context_headers)

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
            error_message, error_code = _extract_error(error_data, error_message)
        except Exception:
            # Response body is not valid JSON; fall back to default error message
            pass

        if response.status_code == 400:
            raise ValidationError(error_message, response.status_code, error_code)
        if response.status_code == 401:
            raise AuthenticationError(error_message, response.status_code, error_code)
        if response.status_code == 403:
            raise AuthorizationError(error_message, response.status_code, error_code)
        if response.status_code == 404:
            raise NotFoundError(error_message, response.status_code, error_code)
        if response.status_code == 409:
            raise ConflictError(error_message, response.status_code, error_code)
        if response.status_code == 429:
            raise RateLimitError(error_message, response.status_code, error_code)

        raise TurboDocxError(error_message, response.status_code, error_code)

    @staticmethod
    def _build_query_string(params: Optional[Dict[str, Any]]) -> str:
        """
        Build a URL-encoded query string from params. None values are skipped;
        list values become repeated keys (e.g. statuses=draft&statuses=sent).
        Keys and values are percent-encoded so special chars don't corrupt the URL.
        """
        if not params:
            return ""
        query_parts: List[str] = []
        for key, value in params.items():
            if value is None:
                continue
            values = value if isinstance(value, list) else [value]
            for item in values:
                if item is None:
                    continue
                query_parts.append(f"{quote(str(key), safe='')}={quote(str(item), safe='')}")
        return "?" + "&".join(query_parts) if query_parts else ""

    async def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """
        Make GET request to API

        Args:
            path: API endpoint path
            params: Optional query parameters dict. Values can be strings,
                    numbers, or lists of strings. None/undefined values are skipped.

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}{self._build_query_string(params)}"

        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.get(url, headers=headers)

                if not response.is_success:
                    await self._handle_error_response(response)

                content_type = response.headers.get("content-type", "")
                if "application/json" in content_type:
                    return normalize_response(self._smart_unwrap(response.json()))

                return response.content
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e

    async def post(self, path: str, data: Any = None) -> Any:
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

                return normalize_response(self._smart_unwrap(response.json()))
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e

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

                return normalize_response(self._smart_unwrap(response.json()))
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e

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
                    return normalize_response(self._smart_unwrap(response.json()))

                return response.content
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e

    async def get_raw(self, path: str, params: Optional[Dict[str, Any]] = None) -> bytes:
        """
        Make GET request and return raw bytes (e.g., for PDF downloads).

        Args:
            path: API endpoint path
            params: Optional query parameters

        Returns:
            Raw response bytes
        """
        url = f"{self.base_url}{path}{self._build_query_string(params)}"

        headers = self._get_headers(include_content_type=False)

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.get(url, headers=headers)

                if not response.is_success:
                    await self._handle_error_response(response)

                return response.content
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e

    async def post_form_data(self, path: str, data: Dict[str, Any], files: Optional[List[Tuple[str, Any]]] = None) -> Any:
        """
        Make POST request with multipart form data.

        Args:
            path: API endpoint path
            data: Form field data (non-file fields)
            files: List of (field_name, (filename, content, content_type)) tuples

        Returns:
            Response data
        """
        return await self._request_form_data("POST", path, data, files)

    async def patch_form_data(self, path: str, data: Dict[str, Any], files: Optional[List[Tuple[str, Any]]] = None) -> Any:
        """
        Make PATCH request with multipart form data.

        Args:
            path: API endpoint path
            data: Form field data (non-file fields)
            files: List of (field_name, (filename, content, content_type)) tuples

        Returns:
            Response data
        """
        return await self._request_form_data("PATCH", path, data, files)

    async def _request_form_data(self, method: str, path: str, data: Dict[str, Any], files: Optional[List[Tuple[str, Any]]] = None) -> Any:
        """
        Internal: make a multipart form data request.

        Args:
            method: HTTP method (POST or PATCH)
            path: API endpoint path
            data: Form field data
            files: Optional list of file tuples

        Returns:
            Response data
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers(include_content_type=False)

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.request(
                    method,
                    url,
                    headers=headers,
                    data=data,
                    files=files or [],
                )

                if not response.is_success:
                    await self._handle_error_response(response)

                return normalize_response(self._smart_unwrap(response.json()))
            except httpx.TimeoutException as e:
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Form data request failed: {str(e) or 'Unknown error'}") from e

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

                return normalize_response(self._smart_unwrap(response.json()))
            except (httpx.NetworkError, httpx.TimeoutException) as e:
                raise NetworkError(f"File upload failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"File upload failed: {str(e) or 'Unknown error'}") from e


class PartnerHttpClient:
    """HTTP client for TurboDocx Partner API

    Uses partner-specific authentication (Partner API Key + Partner ID)
    instead of the standard API key + Org ID used by HttpClient.
    """

    def __init__(
        self,
        partner_api_key: Optional[str] = None,
        partner_id: Optional[str] = None,
        base_url: Optional[str] = None,
        client_context: Optional[ClientContext] = None
    ):
        self.partner_api_key = partner_api_key or os.environ.get("TURBODOCX_PARTNER_API_KEY")
        self.partner_id = partner_id or os.environ.get("TURBODOCX_PARTNER_ID")
        self.base_url = base_url or os.environ.get("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
        # Resolved client-context headers (User-Agent, X-Timezone, ...), computed once.
        self._context_headers = resolve_client_context_headers(client_context)

        if not self.partner_api_key:
            raise AuthenticationError("Partner API key is required")

        if not self.partner_id:
            raise AuthenticationError("Partner ID is required")

    def _get_headers(self) -> Dict[str, str]:
        """Get default headers for partner requests"""
        # Client-context headers (User-Agent, X-Timezone, Accept-Language,
        # X-Forwarded-For, X-Device-Fingerprint) describe the calling environment
        # so the partner audit log records the canonical @turbodocx/sdk token.
        # Copy them first so the SDK's own protocol headers always win over
        # caller context.
        headers: Dict[str, str] = dict(self._context_headers)
        headers["Content-Type"] = "application/json"
        headers["Authorization"] = f"Bearer {self.partner_api_key}"
        return headers

    async def _handle_error_response(self, response: httpx.Response) -> None:
        """Handle error response from API"""
        error_message = f"HTTP {response.status_code}: {response.reason_phrase}"
        error_code: Optional[str] = None

        try:
            error_data = response.json()
            error_message, error_code = _extract_error(error_data, error_message)
        except Exception:
            # Response body is not valid JSON; fall back to default error message
            pass

        if response.status_code == 400:
            raise ValidationError(error_message, response.status_code, error_code)
        if response.status_code == 401:
            raise AuthenticationError(error_message, response.status_code, error_code)
        if response.status_code == 403:
            raise AuthorizationError(error_message, response.status_code, error_code)
        if response.status_code == 404:
            raise NotFoundError(error_message, response.status_code, error_code)
        if response.status_code == 409:
            raise ConflictError(error_message, response.status_code, error_code)
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
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e

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
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e

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
                raise NetworkError(f"Request timed out after 120 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e

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
                raise NetworkError(f"Request timed out after 60 seconds: {str(e) or 'Timeout'}") from e
            except httpx.NetworkError as e:
                raise NetworkError(f"Network request failed: {str(e) or 'Connection error'}") from e
            except TurboDocxError:
                raise
            except Exception as e:
                raise NetworkError(f"Request failed: {str(e) or 'Unknown error'}") from e
