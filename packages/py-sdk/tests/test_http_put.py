"""
HttpClient.put — a JSON PUT (used by reorder_line_item_images), unwrapped like every other call,
and the 409 a refused quote delete comes back as.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from turbodocx_sdk import ConflictError
from turbodocx_sdk.http import HttpClient


def _make_client() -> HttpClient:
    return HttpClient(api_key="TDX-test-key", org_id="org-test", skip_sender_validation=True)


def _patch_async_client(method: str, response: MagicMock):
    mock_http_client = AsyncMock()
    setattr(mock_http_client, method, AsyncMock(return_value=response))
    patcher = patch("httpx.AsyncClient")
    mock_httpx = patcher.start()
    mock_httpx.return_value.__aenter__.return_value = mock_http_client
    return patcher, mock_http_client


@pytest.mark.asyncio
async def test_put_sends_json_and_unwraps_data():
    response = MagicMock(spec=httpx.Response)
    response.status_code = 200
    response.is_success = True
    response.json.return_value = {"data": {"results": [{"id": "img-2"}], "message": "Image order saved"}}
    patcher, http = _patch_async_client("put", response)
    try:
        result = await _make_client().put("/v1/quotes/q-1/items/li-1/images/order", {"imageIds": ["img-2"]})

        url = http.put.call_args[0][0]
        assert url.endswith("/v1/quotes/q-1/items/li-1/images/order")
        assert http.put.call_args[1]["json"] == {"imageIds": ["img-2"]}
        assert result["results"] == [{"id": "img-2"}]
    finally:
        patcher.stop()


@pytest.mark.asyncio
async def test_refused_quote_delete_maps_to_conflict_error_with_its_code():
    message = "A sent quote can't be deleted. Void it instead."
    response = MagicMock(spec=httpx.Response)
    response.status_code = 409
    response.reason_phrase = "Conflict"
    response.is_success = False
    response.headers = {"content-type": "application/json"}
    response.json.return_value = {
        "message": message,
        "error": {"message": message, "code": "CANNOT_DELETE_SENT_QUOTE"},
        "data": {},
    }
    patcher, _ = _patch_async_client("delete", response)
    try:
        with pytest.raises(ConflictError) as exc_info:
            await _make_client().delete("/v1/quotes/q-1")
        assert exc_info.value.status_code == 409
        assert exc_info.value.code == "CANNOT_DELETE_SENT_QUOTE"
        assert message in str(exc_info.value)
    finally:
        patcher.stop()
