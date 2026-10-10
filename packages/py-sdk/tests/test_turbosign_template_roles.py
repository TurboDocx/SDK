"""
TurboSign template signer roles

A template set up in the TurboDocx UI (signers + fields dragged onto the PDF) is sent by naming
each recipient's ``role``. The template's saved fields are used, so ``fields`` may be omitted
(the SDK still sends ``"[]"``). Request bodies carry ``recipients``/``fields`` as JSON strings.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from turbodocx_sdk import TurboSign, ValidationError

TEMPLATE_ID = "84759112-d9d6-443a-bb78-87c427bd7948"


@pytest.fixture(autouse=True)
def reset_client():
    TurboSign._client = None
    yield
    TurboSign._client = None


def _mock_client(post_return=None, get_return=None):
    client = MagicMock()
    client.get_sender_config.return_value = {"sender_email": "sender@company.com", "sender_name": None}
    client.post = AsyncMock(return_value=post_return)
    client.get = AsyncMock(return_value=get_return)
    return client


class TestSendSignatureWithRoles:
    @pytest.mark.asyncio
    async def test_sends_role_and_empty_fields_when_fields_omitted(self):
        client = _mock_client(post_return={"success": True, "documentId": "doc-1", "status": "under_review"})
        with patch.object(TurboSign, "_get_client", return_value=client):
            result = await TurboSign.send_signature(
                template_id=TEMPLATE_ID,
                recipients=[{"role": "client", "name": "Jane Doe", "email": "jane@client.com"}],
            )

        assert result["documentId"] == "doc-1"
        path, kwargs = client.post.call_args[0][0], client.post.call_args[1]
        assert path == "/turbosign/single/prepare-for-signing"
        body = kwargs["data"]
        assert body["templateId"] == TEMPLATE_ID
        assert json.loads(body["recipients"]) == [
            {"role": "client", "name": "Jane Doe", "email": "jane@client.com"}
        ]
        assert json.loads(body["fields"]) == []

    @pytest.mark.asyncio
    async def test_surfaces_api_message_and_code_for_unknown_role(self):
        message = 'Unknown role "clinet". This template\'s roles are: client, countersigner'
        response = MagicMock(spec=httpx.Response)
        response.status_code = 400
        response.reason_phrase = "Bad Request"
        response.is_success = False
        response.json.return_value = {"message": message, "type": "UnknownSignerRole"}
        response.headers = {"content-type": "application/json"}

        http = AsyncMock()
        http.post = AsyncMock(return_value=response)
        with patch("httpx.AsyncClient") as mock_httpx:
            mock_httpx.return_value.__aenter__.return_value = http
            TurboSign.configure(api_key="k", org_id="o", sender_email="sender@company.com")
            with pytest.raises(ValidationError) as exc_info:
                await TurboSign.send_signature(
                    template_id=TEMPLATE_ID,
                    recipients=[{"role": "clinet", "name": "Jane Doe", "email": "jane@client.com"}],
                )

        assert str(exc_info.value) == message
        assert exc_info.value.code == "UnknownSignerRole"


class TestCreateSignatureReviewLinkWithRoles:
    @pytest.mark.asyncio
    async def test_sends_role_to_prepare_for_review_with_empty_fields(self):
        client = _mock_client(post_return={"success": True, "documentId": "doc-2", "status": "review_ready"})
        with patch.object(TurboSign, "_get_client", return_value=client):
            await TurboSign.create_signature_review_link(
                template_id=TEMPLATE_ID,
                recipients=[{"role": "client", "name": "Jane Doe", "email": "jane@client.com"}],
            )

        assert client.post.call_args[0][0] == "/turbosign/single/prepare-for-review"
        body = client.post.call_args[1]["data"]
        assert json.loads(body["recipients"])[0]["role"] == "client"
        assert json.loads(body["fields"]) == []


class TestCreateEmbeddedSignatureWithRoles:
    @pytest.mark.asyncio
    async def test_passes_role_through_to_the_send(self):
        client = _mock_client()
        client.post = AsyncMock(
            side_effect=[
                {
                    "success": True,
                    "documentId": "doc-3",
                    "status": "under_review",
                    "recipients": [{"id": "rec-1", "name": "Jane Doe", "email": "jane@client.com"}],
                },
                {"results": {"url": "https://app/sign/doc-3?token=J", "expiresAt": None, "recipientId": "rec-1"}},
            ]
        )
        with patch.object(TurboSign, "_get_client", return_value=client):
            result = await TurboSign.create_embedded_signature(
                template_id=TEMPLATE_ID,
                recipients=[{"role": "client", "name": "Jane Doe", "email": "jane@client.com"}],
            )

        body = client.post.call_args_list[0][1]["data"]
        assert json.loads(body["recipients"]) == [
            {"name": "Jane Doe", "email": "jane@client.com", "signingOrder": 1, "role": "client"}
        ]
        assert json.loads(body["fields"]) == []
        assert result["recipients"][0]["embedUrl"] == "https://app/sign/doc-3?token=J"

    @pytest.mark.asyncio
    async def test_returns_recipients_in_template_signing_order_not_order_passed(self):
        # The template's roles sign client first; the API returns its signers in that order
        client = _mock_client()
        client.post = AsyncMock(
            side_effect=[
                {
                    "success": True,
                    "documentId": "doc-4",
                    "status": "under_review",
                    "recipients": [
                        {"id": "rec-client", "name": "Jane Doe", "email": "jane@client.com"},
                        {"id": "rec-counter", "name": "Sam Lee", "email": "sam@acme.com"},
                    ],
                },
                {"results": {"url": "https://app/sign?token=J", "expiresAt": None, "recipientId": "rec-client"}},
                {"results": {"url": "https://app/sign?token=S", "expiresAt": None, "recipientId": "rec-counter"}},
            ]
        )
        with patch.object(TurboSign, "_get_client", return_value=client):
            result = await TurboSign.create_embedded_signature(
                template_id=TEMPLATE_ID,
                recipients=[
                    {"role": "countersigner", "name": "Sam Lee", "email": "sam@acme.com"},
                    {"role": "client", "name": "Jane Doe", "email": "jane@client.com"},
                ],
            )

        assert [r["email"] for r in result["recipients"]] == ["jane@client.com", "sam@acme.com"]
        assert [r["embedUrl"] for r in result["recipients"]] == [
            "https://app/sign?token=J",
            "https://app/sign?token=S",
        ]


class TestGetTemplateSignatureSetup:
    @pytest.mark.asyncio
    async def test_gets_roles_and_returns_unwrapped_dict(self):
        summary = {
            "templateId": TEMPLATE_ID,
            "roles": [
                {"key": "client", "label": "Client", "order": 1, "hasSavedSigner": False, "fieldCount": 3},
                {
                    "key": "countersigner",
                    "label": "Countersigner",
                    "order": 2,
                    "hasSavedSigner": True,
                    "defaultName": "Sam Lee",
                    "defaultEmail": "sam@acme.com",
                    "fieldCount": 2,
                },
            ],
        }
        response = MagicMock(spec=httpx.Response)
        response.status_code = 200
        response.is_success = True
        response.json.return_value = {"data": summary}
        response.headers = {"content-type": "application/json"}

        http = AsyncMock()
        http.get = AsyncMock(return_value=response)
        with patch("httpx.AsyncClient") as mock_httpx:
            mock_httpx.return_value.__aenter__.return_value = http
            TurboSign.configure(api_key="k", org_id="o", sender_email="sender@company.com")
            result = await TurboSign.get_template_signature_setup(TEMPLATE_ID)

        http.get.assert_called_once()
        assert http.get.call_args[0][0].endswith(f"/turbosign/templates/{TEMPLATE_ID}/signature-setup")
        assert result == summary

    @pytest.mark.asyncio
    async def test_url_encodes_the_template_id(self):
        client = _mock_client(get_return={"templateId": "a/b", "roles": []})
        with patch.object(TurboSign, "_get_client", return_value=client):
            await TurboSign.get_template_signature_setup("a/b")

        client.get.assert_called_once_with("/turbosign/templates/a%2Fb/signature-setup")
