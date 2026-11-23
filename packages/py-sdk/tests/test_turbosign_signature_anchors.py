"""
TurboSign template signature setups with anchored fields

An anchored field is tied to a template tag (like ``{ClientSign}``) for one signer role. The
add/remove responses arrive as ``{"data": {"results": ...}}``: the HTTP client unwraps ``data``
and the methods unwrap ``results``. Error tests use the real HttpClient over a mocked httpx, so
the status-to-class mapping and the API ``code`` are exercised end to end.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from turbodocx_sdk import ConflictError, NotFoundError, TurboDocxError, TurboSign

TEMPLATE_ID = "84759112-d9d6-443a-bb78-87c427bd7948"

SAVED_SETUP = {
    "roles": [{"roleId": "r1", "label": "Signer 1", "order": 1}],
    "fields": [{"roleId": "r1", "type": "signature", "anchor": "{ClientSign}", "fieldId": "f1"}],
    "savedOn": "2026-11-06T00:00:00.000Z",
}

RECIPIENTS = [{"name": "Jane Doe", "email": "jane@client.com", "signingOrder": 1}]
ANCHORED_FIELD = {"type": "signature", "recipientEmail": "jane@client.com", "template": {"anchor": "{ClientSign}"}}
SENT = {"success": True, "documentId": "doc-1", "status": "under_review"}


@pytest.fixture(autouse=True)
def reset_client():
    TurboSign._client = None
    yield
    TurboSign._client = None


def _mock_client(**returns):
    client = MagicMock()
    client.get_sender_config.return_value = {"sender_email": "sender@company.com", "sender_name": None}
    for method in ("get", "post", "delete", "upload_file"):
        setattr(client, method, AsyncMock(return_value=returns.get(method)))
    return client


def _http_response(body, status):
    response = MagicMock(spec=httpx.Response)
    response.status_code = status
    response.reason_phrase = "OK" if status < 400 else "Error"
    response.is_success = status < 400
    response.json.return_value = body
    response.headers = {"content-type": "application/json"}
    return response


def _patched_httpx(method, body, status):
    """Patch httpx so the real HttpClient sees ``body`` with ``status`` on ``method``."""
    http = AsyncMock()
    setattr(http, method, AsyncMock(return_value=_http_response(body, status)))
    patcher = patch("httpx.AsyncClient")
    mock_httpx = patcher.start()
    mock_httpx.return_value.__aenter__.return_value = http
    TurboSign.configure(api_key="k", org_id="o", sender_email="sender@company.com")
    return patcher, http


class TestApplySignatureSetup:
    @pytest.mark.asyncio
    async def test_sends_true_on_send_signature_and_review_link(self):
        client = _mock_client(post=SENT)
        with patch.object(TurboSign, "_get_client", return_value=client):
            await TurboSign.send_signature(
                template_id=TEMPLATE_ID, recipients=RECIPIENTS, fields=[ANCHORED_FIELD], apply_signature_setup=True
            )
            await TurboSign.create_signature_review_link(
                template_id=TEMPLATE_ID, recipients=RECIPIENTS, fields=[ANCHORED_FIELD], apply_signature_setup=True
            )

        calls = client.post.call_args_list
        assert calls[0][1]["data"]["applySignatureSetup"] is True
        assert calls[1][1]["data"]["applySignatureSetup"] is True

    @pytest.mark.asyncio
    async def test_forwards_explicit_false_and_omits_when_unset(self):
        client = _mock_client(post=SENT)
        with patch.object(TurboSign, "_get_client", return_value=client):
            await TurboSign.send_signature(
                template_id=TEMPLATE_ID, recipients=RECIPIENTS, fields=[ANCHORED_FIELD], apply_signature_setup=False
            )
            await TurboSign.send_signature(template_id=TEMPLATE_ID, recipients=RECIPIENTS, fields=[ANCHORED_FIELD])
            await TurboSign.create_signature_review_link(
                template_id=TEMPLATE_ID, recipients=RECIPIENTS, fields=[ANCHORED_FIELD]
            )

        calls = client.post.call_args_list
        assert calls[0][1]["data"]["applySignatureSetup"] is False
        assert "applySignatureSetup" not in calls[1][1]["data"]
        assert "applySignatureSetup" not in calls[2][1]["data"]

    @pytest.mark.asyncio
    async def test_sent_as_form_field_on_file_upload(self):
        client = _mock_client(upload_file=SENT)
        with patch.object(TurboSign, "_get_client", return_value=client):
            await TurboSign.send_signature(
                file=b"%PDF-1.4", recipients=RECIPIENTS, fields=[ANCHORED_FIELD], apply_signature_setup=True
            )
            await TurboSign.create_signature_review_link(
                file=b"%PDF-1.4", recipients=RECIPIENTS, fields=[ANCHORED_FIELD], apply_signature_setup=False
            )

        calls = client.upload_file.call_args_list
        assert calls[0][1]["additional_data"]["applySignatureSetup"] is True
        assert calls[1][1]["additional_data"]["applySignatureSetup"] is False

    @pytest.mark.asyncio
    async def test_multipart_body_carries_lowercase_true(self):
        # On the wire a multipart boolean must read "true", which the API parses as a boolean
        patcher, http = _patched_httpx("post", {"data": SENT}, 200)
        try:
            await TurboSign.send_signature(
                file=b"%PDF-1.4", recipients=RECIPIENTS, fields=[ANCHORED_FIELD], apply_signature_setup=True
            )
        finally:
            patcher.stop()

        sent = httpx.Request(
            "POST", "http://x", data=http.post.call_args[1]["data"], files=http.post.call_args[1]["files"]
        )
        assert b'name="applySignatureSetup"\r\n\r\ntrue\r\n' in sent.read()


class TestGetTemplateSignatureSetupAnchors:
    @pytest.mark.asyncio
    async def test_anchors_and_anchored_field_count_pass_through(self):
        summary = {
            "templateId": TEMPLATE_ID,
            "roles": [
                {"key": "signer_1", "label": "Signer 1", "order": 1, "hasSavedSigner": False, "fieldCount": 1, "anchoredFieldCount": 1}
            ],
            "anchors": [
                {
                    "fieldId": "f1",
                    "roleKey": "signer_1",
                    "type": "signature",
                    "anchor": "{ClientSign}",
                    "placement": "replace",
                    "notFound": False,
                }
            ],
        }
        patcher, _ = _patched_httpx("get", {"data": summary}, 200)
        try:
            setup = await TurboSign.get_template_signature_setup(TEMPLATE_ID)
        finally:
            patcher.stop()

        assert setup["roles"][0]["anchoredFieldCount"] == 1
        assert setup["anchors"][0] == summary["anchors"][0]


# The template lock middleware's 423 body (no code or type)
LOCKED_BODY = {
    "error": "Resource is locked",
    "message": "This template is currently being edited",
    "data": {"locked": True, "lockedBy": "user-1", "lockedOn": "2026-11-09T10:00:00.000Z"},
}


class TestAddTemplateSignatureAnchor:
    @pytest.mark.asyncio
    async def test_posts_field_without_template_id_and_unwraps_results(self):
        results = {"fieldId": "f1", "signatureSetup": SAVED_SETUP, "tagBecameSignatureField": True}
        patcher, http = _patched_httpx("post", {"data": {"results": results}}, 200)
        try:
            result = await TurboSign.add_template_signature_anchor(
                template_id=TEMPLATE_ID,
                role_key="signer_1",
                type="signature",
                anchor="{ClientSign}",
                size={"width": 120, "height": 30},
                offset={"x": 0, "y": 5},
                placement="replace",
            )
        finally:
            patcher.stop()

        url, kwargs = http.post.call_args[0][0], http.post.call_args[1]
        assert url.endswith(f"/turbosign/templates/{TEMPLATE_ID}/signature-setup/anchors")
        assert kwargs["json"] == {
            "roleKey": "signer_1",
            "type": "signature",
            "anchor": "{ClientSign}",
            "size": {"width": 120, "height": 30},
            "offset": {"x": 0, "y": 5},
            "placement": "replace",
        }
        assert result == results

    @pytest.mark.asyncio
    async def test_forwards_default_value_and_explicit_readonly_false_and_encodes_id(self):
        client = _mock_client(post={"results": {"fieldId": "f2", "signatureSetup": SAVED_SETUP, "tagBecameSignatureField": False}})
        with patch.object(TurboSign, "_get_client", return_value=client):
            result = await TurboSign.add_template_signature_anchor(
                template_id="a/b",
                role_key="signer_1",
                type="text",
                anchor="{ClientTitle}",
                default_value="CEO",
                is_readonly=False,
            )

        client.post.assert_called_once_with(
            "/turbosign/templates/a%2Fb/signature-setup/anchors",
            data={
                "roleKey": "signer_1",
                "type": "text",
                "anchor": "{ClientTitle}",
                "defaultValue": "CEO",
                "isReadonly": False,
            },
        )
        assert result["fieldId"] == "f2"

    @pytest.mark.asyncio
    async def test_tag_owned_by_other_role_is_conflict_error_with_code(self):
        body = {
            "message": "The tag {ClientSign} already belongs to another signer.",
            "type": "AnchorOwnedByOtherRole",
            "error": "x",
            "code": "AnchorOwnedByOtherRole",
        }
        patcher, _ = _patched_httpx("post", body, 409)
        try:
            with pytest.raises(ConflictError) as exc_info:
                await TurboSign.add_template_signature_anchor(
                    template_id=TEMPLATE_ID, role_key="signer_2", type="signature", anchor="{ClientSign}"
                )
        finally:
            patcher.stop()

        assert exc_info.value.code == "AnchorOwnedByOtherRole"
        assert exc_info.value.status_code == 409

    @pytest.mark.asyncio
    async def test_locked_template_is_a_423_turbodocx_error(self):
        # The anchor routes' 423 comes from the template lock middleware: no code or type
        patcher, _ = _patched_httpx("post", LOCKED_BODY, 423)
        try:
            with pytest.raises(TurboDocxError) as exc_info:
                await TurboSign.add_template_signature_anchor(
                    template_id=TEMPLATE_ID, role_key="signer_1", type="signature", anchor="{ClientSign}"
                )
        finally:
            patcher.stop()

        assert exc_info.value.status_code == 423
        assert str(exc_info.value) == "This template is currently being edited"


class TestRemoveTemplateSignatureAnchor:
    @pytest.mark.asyncio
    async def test_deletes_by_encoded_field_id_and_unwraps_results(self):
        patcher, http = _patched_httpx(
            "delete", {"data": {"results": {"signatureSetup": {**SAVED_SETUP, "fields": []}}}}, 200
        )
        try:
            result = await TurboSign.remove_template_signature_anchor(TEMPLATE_ID, "f/1")
        finally:
            patcher.stop()

        assert http.delete.call_args[0][0].endswith(
            f"/turbosign/templates/{TEMPLATE_ID}/signature-setup/anchors/f%2F1"
        )
        assert result["signatureSetup"]["fields"] == []

    @pytest.mark.asyncio
    async def test_unknown_field_id_is_not_found_error(self):
        patcher, _ = _patched_httpx(
            "delete", {"message": "No anchored field with this id in the signature setup", "code": "SetupFieldNotFound"}, 404
        )
        try:
            with pytest.raises(NotFoundError) as exc_info:
                await TurboSign.remove_template_signature_anchor(TEMPLATE_ID, "nope")
        finally:
            patcher.stop()

        assert exc_info.value.code == "SetupFieldNotFound"

    @pytest.mark.asyncio
    async def test_locked_template_on_remove_is_a_423_turbodocx_error(self):
        patcher, _ = _patched_httpx("delete", LOCKED_BODY, 423)
        try:
            with pytest.raises(TurboDocxError) as exc_info:
                await TurboSign.remove_template_signature_anchor(TEMPLATE_ID, "f1")
        finally:
            patcher.stop()

        assert exc_info.value.status_code == 423
