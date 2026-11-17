"""
TurboSign ``fit_anchored_tags``

On the two send paths (and ``create_embedded_signature``, which sends through
``send_signature``), ``fitAnchoredTags`` is sent only when ``fit_anchored_tags`` is True.
The API treats False the same as a missing key, so False and None leave it out and every
existing request body stays exactly as it was.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from turbodocx_sdk import TurboSign

RECIPIENTS = [{"name": "Jane Doe", "email": "jane@example.com", "signingOrder": 1}]
FIELDS = [{"type": "signature", "recipientEmail": "jane@example.com", "template": {"anchor": "{ClientSign}"}}]
SENT = {
    "success": True,
    "documentId": "doc-1",
    "status": "under_review",
    "recipients": [{"id": "rec-1", "name": "Jane Doe", "email": "jane@example.com"}],
}
SIGNING_URL = {
    "url": "https://app/sign/doc-1?token=T",
    "expiresAt": None,
    "recipientId": "rec-1",
    "identityVerificationMode": None,
    "pendingChecks": [],
}


@pytest.fixture(autouse=True)
def reset_client():
    TurboSign._client = None
    yield
    TurboSign._client = None


def _mock_client():
    client = MagicMock()
    client.get_sender_config.return_value = {"sender_email": "sender@company.com", "sender_name": None}
    client.post = AsyncMock(return_value=SENT)
    client.upload_file = AsyncMock(return_value=SENT)
    return client


SENDS = [
    ("send_signature", "/turbosign/single/prepare-for-signing"),
    ("create_signature_review_link", "/turbosign/single/prepare-for-review"),
]


async def _upload_form(method, path, **extra):
    client = _mock_client()
    with patch.object(TurboSign, "_get_client", return_value=client):
        await getattr(TurboSign, method)(RECIPIENTS, FIELDS, file=b"%PDF-1.4 fake", **extra)
    assert client.upload_file.call_args[0][0] == path
    return client.upload_file.call_args[1]["additional_data"]


async def _json_body(method, path, **extra):
    client = _mock_client()
    with patch.object(TurboSign, "_get_client", return_value=client):
        await getattr(TurboSign, method)(RECIPIENTS, FIELDS, file_link="https://example.com/contract.pdf", **extra)
    assert client.post.call_args[0][0] == path
    return client.post.call_args[1]["data"]


@pytest.mark.parametrize("method,path", SENDS)
class TestFitAnchoredTagsOnSends:
    @pytest.mark.asyncio
    async def test_upload_sends_the_flag_when_true(self, method, path):
        form = await _upload_form(method, path, fit_anchored_tags=True)
        # httpx encodes a True form value as "true", the value the API reads
        assert form["fitAnchoredTags"] is True

    @pytest.mark.asyncio
    async def test_upload_leaves_the_key_out_when_false_or_unset(self, method, path):
        unset = await _upload_form(method, path)
        off = await _upload_form(method, path, fit_anchored_tags=False)
        on = await _upload_form(method, path, fit_anchored_tags=True)

        assert "fitAnchoredTags" not in unset
        assert off == unset
        assert {k: v for k, v in on.items() if k != "fitAnchoredTags"} == unset

    @pytest.mark.asyncio
    async def test_json_sends_the_flag_when_true(self, method, path):
        body = await _json_body(method, path, fit_anchored_tags=True)
        assert body["fitAnchoredTags"] is True

    @pytest.mark.asyncio
    async def test_json_leaves_the_key_out_when_false_or_unset(self, method, path):
        unset = await _json_body(method, path)
        off = await _json_body(method, path, fit_anchored_tags=False)
        on = await _json_body(method, path, fit_anchored_tags=True)

        assert "fitAnchoredTags" not in unset
        assert off == unset
        assert {k: v for k, v in on.items() if k != "fitAnchoredTags"} == unset


async def _embedded_send_body(**extra):
    client = _mock_client()
    # 1st post: the send; 2nd post: the signing URL
    client.post = AsyncMock(side_effect=[SENT, SIGNING_URL])
    with patch.object(TurboSign, "_get_client", return_value=client):
        await TurboSign.create_embedded_signature(
            [{"name": "Jane Doe", "email": "jane@example.com", "fields": {"signature": "{ClientSign}"}}],
            file_link="https://example.com/contract.pdf",
            **extra,
        )
    assert client.post.call_args_list[0][0][0] == "/turbosign/single/prepare-for-signing"
    return client.post.call_args_list[0][1]["data"]


class TestFitAnchoredTagsOnEmbeddedSignature:
    @pytest.mark.asyncio
    async def test_passes_the_flag_to_the_send_when_true(self):
        body = await _embedded_send_body(fit_anchored_tags=True)
        assert body["fitAnchoredTags"] is True

    @pytest.mark.asyncio
    async def test_leaves_the_key_out_when_false_or_unset(self):
        unset = await _embedded_send_body()
        off = await _embedded_send_body(fit_anchored_tags=False)

        assert "fitAnchoredTags" not in unset
        assert off == unset
