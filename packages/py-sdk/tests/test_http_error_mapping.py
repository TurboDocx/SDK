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
    NetworkError,
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


# ============================================================================
# Error detail + code extraction
#
# The API reports failures in several envelopes. Reading only the top-level
# `message`/`error` loses the actionable reason ("senderEmail must be a valid
# email address") and the specific code (QUOTE_NOT_FOUND) — and, for the nested
# `error: {...}` shape used across TurboQuote, would stringify the whole object.
# ============================================================================


@pytest.mark.asyncio
async def test_surfaces_per_field_reason_over_generic_envelope():
    """data.errors[] carries what the caller must fix; the envelope message does not."""
    client = _make_client()
    response = _mock_response(
        400,
        {
            "message": "There was an issue validating the body",
            "type": "ValidationError",
            "data": {"errors": [{"message": "senderEmail must be a valid email address"}]},
        },
    )
    patcher = _patch_get(response)
    try:
        with pytest.raises(ValidationError) as exc_info:
            await client.get("/turbosign/single/prepare-for-review")
        assert "senderEmail must be a valid email address" in str(exc_info.value)
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_joins_multiple_field_errors():
    client = _make_client()
    response = _mock_response(
        400,
        {
            "message": "There was an issue validating the body",
            "data": {
                "errors": [
                    {"message": "senderEmail must be a valid email address"},
                    {"message": '"recipients" is required'},
                ]
            },
        },
    )
    patcher = _patch_get(response)
    try:
        with pytest.raises(ValidationError) as exc_info:
            await client.get("/turbosign/single/prepare-for-review")
        message = str(exc_info.value)
        assert "senderEmail must be a valid email address" in message
        assert '"recipients" is required' in message
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_falls_back_to_top_level_message_without_field_errors():
    client = _make_client()
    response = _mock_response(
        400, {"message": "A sender email is required for API-key requests.", "error": "SenderEmailRequired"}
    )
    patcher = _patch_get(response)
    try:
        with pytest.raises(ValidationError) as exc_info:
            await client.get("/turbosign/single/prepare-for-review")
        assert "A sender email is required for API-key requests." in str(exc_info.value)
        # `error` alongside a `message` is the CODE, not the message.
        assert exc_info.value.code == "SenderEmailRequired"
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_empty_errors_array_does_not_blank_the_message():
    client = _make_client()
    response = _mock_response(400, {"message": "There was an issue validating the body", "data": {"errors": []}})
    patcher = _patch_get(response)
    try:
        with pytest.raises(ValidationError) as exc_info:
            await client.get("/turbosign/single/prepare-for-review")
        assert "There was an issue validating the body" in str(exc_info.value)
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_reads_message_and_code_from_nested_error_object():
    """The TurboQuote surface returns {"error": {"message", "code"}} — never stringify it."""
    client = _make_client()
    response = _mock_response(404, {"error": {"message": "Quote not found", "code": "QUOTE_NOT_FOUND"}})
    patcher = _patch_get(response)
    try:
        with pytest.raises(NotFoundError) as exc_info:
            await client.get("/v1/quotes/missing")
        assert str(exc_info.value) == "Quote not found"
        assert exc_info.value.code == "QUOTE_NOT_FOUND"
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_surfaces_top_level_errors_array_for_bulk():
    """Bulk validation puts per-row reasons in a TOP-LEVEL errors[], not under data."""
    client = _make_client()
    response = _mock_response(
        400,
        {
            "message": "Bulk validation failed",
            "type": "BulkValidationFailed",
            "errors": [{"message": "Row 1: recipient email is invalid"}, {"message": "Row 3: name is required"}],
        },
    )
    patcher = _patch_get(response)
    try:
        with pytest.raises(ValidationError) as exc_info:
            await client.get("/turbosign/bulk/ingest")
        message = str(exc_info.value)
        assert "Row 1: recipient email is invalid" in message
        assert "Row 3: name is required" in message
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_reads_code_from_top_level_type():
    client = _make_client()
    response = _mock_response(400, {"message": "Recipient name is required", "type": "RecipientNameRequired"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(ValidationError) as exc_info:
            await client.get("/turbosign/single/prepare-for-signing")
        assert exc_info.value.code == "RecipientNameRequired"
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_lone_error_string_is_the_message_not_the_code():
    """SingleStepRoutes sends {error: <message>, code: <type>} — with no `message` key the
    string IS the message and must not also be reported as the code."""
    client = _make_client()
    response = _mock_response(400, {"error": "Document could not be prepared", "code": "TemplateProcessingFailed"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(ValidationError) as exc_info:
            await client.get("/turbosign/single/prepare-for-signing")
        assert str(exc_info.value) == "Document could not be prepared"
        assert exc_info.value.code == "TemplateProcessingFailed"
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_falls_back_to_class_default_code_when_api_sends_none():
    """Not every backend error carries a code, but `err.code` must still be branchable —
    so the class default fills the gap. Matches the other five SDKs."""
    client = _make_client()
    response = _mock_response(404, {"message": "Resource missing"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(NotFoundError) as exc_info:
            await client.get("/v1/anything")
        assert exc_info.value.code == "NOT_FOUND"
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_api_supplied_code_wins_over_class_default():
    """The default must never mask a real code the backend sent."""
    client = _make_client()
    response = _mock_response(404, {"message": "Quote missing", "code": "QUOTE_NOT_FOUND"})
    patcher = _patch_get(response)
    try:
        with pytest.raises(NotFoundError) as exc_info:
            await client.get("/v1/anything")
        assert exc_info.value.code == "QUOTE_NOT_FOUND"
    finally:
        patcher.stop()


def test_every_error_subclass_carries_a_default_code():
    """Parity guard: all six SDKs populate `code` for every typed error."""
    assert AuthenticationError("x").code == "AUTHENTICATION_ERROR"
    assert AuthorizationError("x").code == "AUTHORIZATION_ERROR"
    assert ValidationError("x").code == "VALIDATION_ERROR"
    assert NotFoundError("x").code == "NOT_FOUND"
    assert ConflictError("x").code == "CONFLICT"
    assert RateLimitError("x").code == "RATE_LIMIT_EXCEEDED"
    assert NetworkError("x").code == "NETWORK_ERROR"
