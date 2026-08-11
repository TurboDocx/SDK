"""
TurboSign reminder + expiration schedule tests (py-sdk).

Mirrors the js-sdk suite case-for-case, per the cross-SDK test-parity rule.

Durations are JSON-encoded on both send paths: multipart/form-data cannot carry a nested value,
and the API decodes a JSON-string duration on either content type, so one code path serves both.
Request-body keys stay camelCase — the API is not snake_case-aware.
"""

import json
from unittest.mock import AsyncMock, patch

import pytest

from turbodocx_sdk.modules.sign import TurboSign

RECIPIENTS = [{"name": "John Doe", "email": "john@example.com", "signingOrder": 1}]
FIELDS = [
    {
        "type": "signature",
        "page": 1,
        "x": 100,
        "y": 500,
        "width": 200,
        "height": 50,
        "recipientEmail": "john@example.com",
    }
]


@pytest.fixture(autouse=True)
def _configure():
    TurboSign.configure(
        api_key="test-key", org_id="org-1", sender_email="sender@company.com"
    )
    yield
    TurboSign._client = None


def _post_body(mock_post):
    """The JSON body the SDK sent (this module passes it as the `data=` kwarg)."""
    return mock_post.call_args.kwargs["data"]


class TestScheduleOverrides:
    @pytest.mark.asyncio
    async def test_sends_every_schedule_field(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(return_value={"documentId": "doc-1"})

            await TurboSign.send_signature(
                recipients=RECIPIENTS,
                fields=FIELDS,
                deliverable_id="deliv-1",
                reminders_enabled=True,
                reminder_delay={"value": 3, "unit": "days"},
                reminder_interval={"value": 12, "unit": "hours"},
                max_reminders=5,
                expiration_enabled=True,
                expire_after={"value": 30, "unit": "days"},
                expiration_warning={"value": 3, "unit": "days"},
                expiration_warning_interval={"value": 1, "unit": "days"},
            )

            body = _post_body(client.post)
            assert body["remindersEnabled"] is True
            assert body["maxReminders"] == 5
            assert body["expirationEnabled"] is True
            assert json.loads(body["reminderDelay"]) == {"value": 3, "unit": "days"}
            assert json.loads(body["reminderInterval"]) == {"value": 12, "unit": "hours"}
            assert json.loads(body["expireAfter"]) == {"value": 30, "unit": "days"}
            assert json.loads(body["expirationWarning"]) == {"value": 3, "unit": "days"}
            assert json.loads(body["expirationWarningInterval"]) == {"value": 1, "unit": "days"}

    @pytest.mark.asyncio
    async def test_omits_every_schedule_key_when_unset(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(return_value={"documentId": "doc-1"})

            await TurboSign.send_signature(
                recipients=RECIPIENTS, fields=FIELDS, deliverable_id="deliv-1"
            )

            body = _post_body(client.post)
            for key in (
                "remindersEnabled",
                "reminderDelay",
                "reminderInterval",
                "maxReminders",
                "expirationEnabled",
                "expireAfter",
                "expirationWarning",
                "expirationWarningInterval",
            ):
                assert key not in body

    # False and 0 are meaningful values, not "unset" — a truthiness check would drop them and
    # silently fall back to the org default, the opposite of what the caller asked for.
    @pytest.mark.asyncio
    async def test_sends_false_rather_than_dropping_it(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(return_value={})

            await TurboSign.send_signature(
                recipients=RECIPIENTS,
                fields=FIELDS,
                deliverable_id="d",
                reminders_enabled=False,
                expiration_enabled=False,
            )

            body = _post_body(client.post)
            assert body["remindersEnabled"] is False
            assert body["expirationEnabled"] is False

    @pytest.mark.asyncio
    async def test_sends_zero_and_negative_max_reminders(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(return_value={})

            await TurboSign.send_signature(
                recipients=RECIPIENTS, fields=FIELDS, deliverable_id="d", max_reminders=0
            )
            assert _post_body(client.post)["maxReminders"] == 0

            await TurboSign.send_signature(
                recipients=RECIPIENTS, fields=FIELDS, deliverable_id="d", max_reminders=-1
            )
            assert _post_body(client.post)["maxReminders"] == -1

    # Zero is legal for the warning offset alone, and means "never warn".
    @pytest.mark.asyncio
    async def test_sends_zero_expiration_warning(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(return_value={})

            await TurboSign.send_signature(
                recipients=RECIPIENTS,
                fields=FIELDS,
                deliverable_id="d",
                expiration_warning={"value": 0, "unit": "hours"},
            )

            assert json.loads(_post_body(client.post)["expirationWarning"]) == {
                "value": 0,
                "unit": "hours",
            }


class TestSendReminder:
    @pytest.mark.asyncio
    async def test_posts_to_the_send_reminder_endpoint(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(return_value={"results": []})

            await TurboSign.send_reminder("doc-123")

            client.post.assert_called_once_with(
                "/turbosign/documents/doc-123/send-reminder", data={}
            )

    @pytest.mark.asyncio
    async def test_passes_named_recipient_ids(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(return_value={"results": []})

            await TurboSign.send_reminder("doc-123", ["r-1", "r-2"])

            client.post.assert_called_once_with(
                "/turbosign/documents/doc-123/send-reminder",
                data={"recipientIds": ["r-1", "r-2"]},
            )

    # An empty list is a caller mistake the API would 400 on (min 1 when the key is present).
    # Treat it as "no filter" rather than forwarding a request that cannot succeed.
    @pytest.mark.asyncio
    async def test_empty_recipient_list_is_treated_as_unfiltered(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(return_value={"results": []})

            await TurboSign.send_reminder("doc-123", [])

            assert "recipientIds" not in _post_body(client.post)

    @pytest.mark.asyncio
    async def test_returns_per_recipient_results(self):
        with patch.object(TurboSign, "_get_client") as get_client:
            client = get_client.return_value
            client.post = AsyncMock(
                return_value={
                    "results": [
                        {"recipientId": "r-1", "status": "sent", "reminderCount": 2, "phase": "reminder"},
                        {"recipientId": "r-2", "status": "skipped_wrong_order"},
                    ]
                }
            )

            result = await TurboSign.send_reminder("doc-123")

            assert len(result["results"]) == 2
            assert result["results"][0]["status"] == "sent"
            # A later-order signer is reported, not silently dropped.
            assert result["results"][1]["status"] == "skipped_wrong_order"
