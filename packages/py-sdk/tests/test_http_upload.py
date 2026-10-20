"""
HttpClient.upload_file part naming

The API checks the uploaded part's own extension (.pdf/.docx/.pptx). A file path keeps its
basename when that extension is supported; otherwise the part is document.<detected ext>, like a
bytes upload. Only the network send (httpx.AsyncClient.post) is mocked.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from turbodocx_sdk.http import HttpClient

PDF = b"%PDF-1.4 fake pdf bytes"


async def _part_name(file) -> str:
    client = HttpClient(api_key="k", org_id="o", sender_email="s@example.com")
    response = MagicMock(is_success=True)
    response.json.return_value = {"data": {"success": True}}
    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=response)) as post:
        await client.upload_file("/upload", file)
    return post.call_args.kwargs["files"]["file"][0]


def _write(tmp_path, name: str) -> str:
    path = tmp_path / name
    path.write_bytes(PDF)
    return str(path)


class TestUploadPartName:
    @pytest.mark.asyncio
    async def test_path_without_extension_becomes_document_ext(self, tmp_path):
        assert await _part_name(_write(tmp_path, "upload-7f3a")) == "document.pdf"

    @pytest.mark.asyncio
    async def test_path_with_unsupported_extension_becomes_document_ext(self, tmp_path):
        assert await _part_name(_write(tmp_path, "notes.txt")) == "document.pdf"

    @pytest.mark.asyncio
    async def test_path_with_supported_extension_keeps_basename_any_case(self, tmp_path):
        assert await _part_name(_write(tmp_path, "SCAN.PDF")) == "SCAN.PDF"

    @pytest.mark.asyncio
    async def test_bytes_upload_is_document_ext(self):
        assert await _part_name(PDF) == "document.pdf"
