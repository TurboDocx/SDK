"""
TurboSign requests without ``fit_anchored_tags``

With the option absent, every request is exactly what it was before the option existed: the
same path and body, key for key and in the same order, on both send paths (multipart and JSON)
and on ``create_embedded_signature``, whose ``fields`` shorthand keeps its default size. These
expectations pass unchanged against the code from before the option was added.
"""

import json
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
# Every other option, so the order of all the keys around the flag is pinned too.
OPTIONS = {
    "document_name": "Contract",
    "document_description": "Please sign",
    "sender_name": "Acme",
    "cc_emails": ["cc@example.com"],
    "reminders_enabled": True,
    "reminder_delay": {"value": 2, "unit": "days"},
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


def _expected(method):
    body = [
        ("recipients", json.dumps(RECIPIENTS)),
        ("fields", json.dumps(FIELDS)),
        ("documentName", "Contract"),
        ("documentDescription", "Please sign"),
        ("senderEmail", "sender@company.com"),
        ("senderName", "Acme"),
        ("ccEmails", json.dumps(["cc@example.com"])),
    ]
    # send_email is a send option: the review link has never had it.
    if method == "send_signature":
        body.append(("sendEmail", False))
    body += [
        ("remindersEnabled", True),
        ("reminderDelay", json.dumps({"value": 2, "unit": "days"})),
    ]
    return body


def _extra(method):
    return {**OPTIONS, "send_email": False} if method == "send_signature" else OPTIONS


SENDS = [
    ("send_signature", "/turbosign/single/prepare-for-signing"),
    ("create_signature_review_link", "/turbosign/single/prepare-for-review"),
]


@pytest.mark.parametrize("method,path", SENDS)
class TestRequestsWithoutFitAnchoredTags:
    @pytest.mark.asyncio
    async def test_the_multipart_form_is_unchanged(self, method, path):
        client = _mock_client()
        with patch.object(TurboSign, "_get_client", return_value=client):
            await getattr(TurboSign, method)(RECIPIENTS, FIELDS, file=b"%PDF-1.4 fake", **_extra(method))

        assert client.upload_file.call_args[0] == (path,)
        assert client.upload_file.call_args[1]["file"] == b"%PDF-1.4 fake"
        assert list(client.upload_file.call_args[1]["additional_data"].items()) == _expected(method)
        client.post.assert_not_called()

    @pytest.mark.asyncio
    async def test_the_json_body_is_unchanged(self, method, path):
        client = _mock_client()
        with patch.object(TurboSign, "_get_client", return_value=client):
            await getattr(TurboSign, method)(
                RECIPIENTS, FIELDS, file_link="https://example.com/c.pdf", **_extra(method)
            )

        assert client.post.call_args[0] == (path,)
        assert list(client.post.call_args[1]["data"].items()) == _expected(method) + [
            ("fileLink", "https://example.com/c.pdf")
        ]
        client.upload_file.assert_not_called()


@pytest.mark.asyncio
async def test_create_embedded_signature_sends_the_same_body_with_the_shorthand_size():
    client = _mock_client()
    client.post = AsyncMock(side_effect=[SENT, SIGNING_URL])
    with patch.object(TurboSign, "_get_client", return_value=client):
        await TurboSign.create_embedded_signature(
            [{"name": "Jane Doe", "email": "jane@example.com", "fields": {"signature": "{ClientSign}", "date": "{Date}"}}],
            file_link="https://example.com/c.pdf",
        )

    assert client.post.call_args_list[0][0] == ("/turbosign/single/prepare-for-signing",)
    body = client.post.call_args_list[0][1]["data"]
    assert list(body.keys()) == ["recipients", "fields", "senderEmail", "sendEmail", "fileLink"]
    assert body["fields"] == json.dumps(
        [
            {
                "type": "signature",
                "recipientEmail": "jane@example.com",
                "template": {"anchor": "{ClientSign}", "placement": "replace", "size": {"width": 100, "height": 30}},
            },
            {
                "type": "date",
                "recipientEmail": "jane@example.com",
                "template": {"anchor": "{Date}", "placement": "replace", "size": {"width": 75, "height": 30}},
            },
        ]
    )
    assert body["sendEmail"] is False
