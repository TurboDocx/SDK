"""
TurboQuote reminder + expiration schedule serialization tests (py-sdk).

The quote send endpoints are JSON (unlike the multipart signature send), so the eight schedule
fields ride FLAT at the top level of the request body -- NOT nested under a "schedule" key -- and
durations serialize as plain ``{"value", "unit"}`` dicts, not JSON-encoded strings. Presence is
null-checked, so a deliberate ``False`` / ``0`` survives while an unset field is omitted and
inherits the org default. Request-body keys stay camelCase (the API is not snake_case-aware),
even though ``send_quote`` accepts the overrides via snake_case kwargs.

Mirrors the js-sdk turboquote-schedule suite case-for-case, per the cross-SDK test-parity rule.
"""

import pytest
from unittest.mock import AsyncMock

from turbodocx_sdk import TurboQuote

SCHEDULE_KEYS = (
    "remindersEnabled",
    "reminderDelay",
    "reminderInterval",
    "maxReminders",
    "expirationEnabled",
    "expireAfter",
    "expirationWarning",
    "expirationWarningInterval",
)


class TestQuoteScheduleSerialization:
    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client
        yield
        TurboQuote._client = None

    @pytest.mark.asyncio
    async def test_send_quote_sends_every_field_flat_with_object_durations(self):
        self.mock_client.post = AsyncMock(
            return_value={"result": {"id": "q-1", "status": "sent"}, "message": "Quote sent"}
        )

        await TurboQuote.send_quote(
            "q-1",
            {"ccEmails": ["admin@example.com"]},
            reminders_enabled=True,
            reminder_delay={"value": 3, "unit": "days"},
            reminder_interval={"value": 12, "unit": "hours"},
            max_reminders=5,
            expiration_enabled=True,
            expire_after={"value": 30, "unit": "days"},
            expiration_warning={"value": 3, "unit": "days"},
            expiration_warning_interval={"value": 1, "unit": "days"},
        )

        body = self.mock_client.post.call_args[0][1]

        # Flat at the top level, never nested under "schedule".
        assert "schedule" not in body

        # Native bool / int -- not stringified.
        assert body["remindersEnabled"] is True
        assert body["expirationEnabled"] is True
        assert body["maxReminders"] == 5

        # Durations are dict OBJECTS, not JSON strings (this is a JSON endpoint).
        assert body["reminderDelay"] == {"value": 3, "unit": "days"}
        assert isinstance(body["reminderDelay"], dict)
        assert body["reminderInterval"] == {"value": 12, "unit": "hours"}
        assert body["expireAfter"] == {"value": 30, "unit": "days"}
        assert body["expirationWarning"] == {"value": 3, "unit": "days"}
        assert body["expirationWarningInterval"] == {"value": 1, "unit": "days"}

        # Unrelated send options ride alongside.
        assert body["ccEmails"] == ["admin@example.com"]

    @pytest.mark.asyncio
    async def test_send_quote_omits_every_schedule_key_when_unset(self):
        self.mock_client.post = AsyncMock(
            return_value={"result": {"id": "q-1", "status": "sent"}, "message": "Quote sent"}
        )

        await TurboQuote.send_quote("q-1", {"ccEmails": ["admin@example.com"]})

        body = self.mock_client.post.call_args[0][1]
        for key in SCHEDULE_KEYS:
            assert key not in body

    # False and 0 are meaningful, not "unset" -- dropping them would silently fall back to the org
    # default, the opposite of what the caller asked for.
    @pytest.mark.asyncio
    async def test_send_quote_preserves_meaningful_zeros(self):
        self.mock_client.post = AsyncMock(
            return_value={"result": {"id": "q-1", "status": "sent"}, "message": "Quote sent"}
        )

        await TurboQuote.send_quote("q-1", max_reminders=0, expiration_enabled=False)

        body = self.mock_client.post.call_args[0][1]
        assert body["maxReminders"] == 0
        assert body["expirationEnabled"] is False

    @pytest.mark.asyncio
    async def test_send_quote_with_deliverable_carries_schedule_flat(self):
        self.mock_client.post = AsyncMock(
            return_value={
                "result": {"id": "q-1", "status": "sent"},
                "message": "Sent",
                "documentId": "doc-2",
            }
        )

        await TurboQuote.send_quote_with_deliverable(
            "q-1",
            {"deliverableId": "del-1", "mergePosition": "end"},
            reminders_enabled=True,
            reminder_delay={"value": 2, "unit": "days"},
            expiration_enabled=False,
        )

        body = self.mock_client.post.call_args[0][1]
        assert "schedule" not in body
        assert body["deliverableId"] == "del-1"
        assert body["remindersEnabled"] is True
        assert body["reminderDelay"] == {"value": 2, "unit": "days"}
        assert body["expirationEnabled"] is False

    @pytest.mark.asyncio
    async def test_create_and_send_emits_flat_schedule_on_send_step(self):
        quote = {"id": "q-1", "name": "Enterprise License", "status": "draft"}
        self.mock_client.post = AsyncMock(
            side_effect=[
                {"result": quote, "message": "Quote created successfully"},
                {"result": {**quote, "status": "sent"}, "message": "Sent"},
            ]
        )

        await TurboQuote.create_and_send(
            {
                "name": "Enterprise License",
                "companyId": "c-1",
                "contactId": "ct-1",
                "send": {
                    "remindersEnabled": True,
                    "maxReminders": 0,
                    "reminderDelay": {"value": 1, "unit": "days"},
                },
            }
        )

        calls = self.mock_client.post.call_args_list
        assert calls[0][0][0] == "/v1/quotes"
        assert calls[1][0][0] == "/v1/quotes/q-1/send"

        send_body = calls[1][0][1]
        assert "schedule" not in send_body
        assert send_body["remindersEnabled"] is True
        assert send_body["maxReminders"] == 0
        assert send_body["reminderDelay"] == {"value": 1, "unit": "days"}
