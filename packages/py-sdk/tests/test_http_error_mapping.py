"""
HTTP Error Mapping Tests

Verifies the HttpClient's status code -> typed exception mapping.
Mocks httpx.AsyncClient to return responses with various status codes
and asserts the right TurboDocxError subclass is raised.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from turbodocx_sdk import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    RateLimitError,
    TurboDocxError,
    ValidationError,
)
from turbodocx_sdk.http import HttpClient


def _make_client() -> HttpClient:
    return HttpClient(
        api_key="TDX-test-key",
        org_id="org-test",
        sender_email="test@example.com",
    )


def _mock_response(status_code: int, body: dict) -> MagicMock:
    response = MagicMock(spec=httpx.Response)
    response.status_code = status_code
    response.reason_phrase = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        409: "Conflict",
        429: "Too Many Requests",
        500: "Internal Server Error",
    }.get(status_code, "Error")
    response.is_success = False
    response.json.return_value = body
    response.headers = {"content-type": "application/json"}
    return response


def _patch_get(mock_response: MagicMock):
    """Context-manager helper that patches httpx.AsyncClient so .get returns mock_response."""
    mock_http_client = AsyncMock()
    mock_http_client.get = AsyncMock(return_value=mock_response)
    patcher = patch("httpx.AsyncClient")
    mock_httpx = patcher.start()
    mock_httpx.return_value.__aenter__.return_value = mock_http_client
    return patcher


@pytest.mark.asyncio
async def test_400_maps_to_validation_error():
    client = _make_client()
    response = _mock_response(400, {"message": "Bad input", "code": "BAD_INPUT"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(ValidationError) as exc_info:
            await client.get("/api/anything")
        assert exc_info.value.status_code == 400
        assert exc_info.value.code == "BAD_INPUT"
        assert "Bad input" in str(exc_info.value)
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_401_maps_to_authentication_error():
    client = _make_client()
    response = _mock_response(401, {"message": "Invalid API key"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(AuthenticationError) as exc_info:
            await client.get("/api/anything")
        assert exc_info.value.status_code == 401
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_403_maps_to_authorization_error():
    client = _make_client()
    response = _mock_response(403, {"message": "Forbidden"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(AuthorizationError) as exc_info:
            await client.get("/api/anything")
        assert exc_info.value.status_code == 403
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_404_maps_to_not_found_error():
    client = _make_client()
    response = _mock_response(404, {"message": "Resource not found"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(NotFoundError) as exc_info:
            await client.get("/api/anything")
        assert exc_info.value.status_code == 404
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_409_maps_to_conflict_error():
    """409 conflicts (e.g. duplicate webhook name) should map to ConflictError."""
    client = _make_client()
    response = _mock_response(
        409,
        {"message": "Webhook with this name already exists", "code": "CONFLICT"},
    )
    patcher = _patch_get(response)
    try:
        with pytest.raises(ConflictError) as exc_info:
            await client.get("/api/anything")
        assert exc_info.value.status_code == 409
        assert exc_info.value.code == "CONFLICT"
        assert "already exists" in str(exc_info.value)
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_429_maps_to_rate_limit_error():
    client = _make_client()
    response = _mock_response(429, {"message": "Too many requests"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(RateLimitError) as exc_info:
            await client.get("/api/anything")
        assert exc_info.value.status_code == 429
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_500_maps_to_generic_turbodocx_error():
    client = _make_client()
    response = _mock_response(500, {"message": "Internal server error"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(TurboDocxError) as exc_info:
            await client.get("/api/anything")
        # Ensure it's the base class, not a subclass
        assert type(exc_info.value) is TurboDocxError
        assert exc_info.value.status_code == 500
    finally:
        patcher.stop()


def test_conflict_error_is_subclass_of_turbodocx_error():
    """ConflictError must extend the base TurboDocxError so generic except clauses work."""
    err = ConflictError("dup", 409, "CONFLICT")
    assert isinstance(err, TurboDocxError)
    assert err.status_code == 409
    assert err.code == "CONFLICT"
