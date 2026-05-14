"""
TurboWebhooks Module Tests

Mocks _get_client() to return a MagicMock whose async verb methods are AsyncMocks.
Same pattern as test_turbopartner.py.
"""

import hmac
import os
from hashlib import sha256
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from turbodocx_sdk import (
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    TurboWebhooks,
    ValidationError,
    verify_webhook_signature,
)


API_KEY = "TDX-test-key-abc123"
ORG_ID = "org-uuid-test"


def _reset():
    """Reset the module's static client between tests."""
    TurboWebhooks._client = None
    for var in ("TURBODOCX_API_KEY", "TURBODOCX_ORG_ID"):
        os.environ.pop(var, None)


# ============================================
# CONFIGURATION
# ============================================


class TestConfigure:
    def setup_method(self):
        _reset()

    def test_configure_sets_skip_sender_validation(self):
        TurboWebhooks.configure(api_key=API_KEY, org_id=ORG_ID)
        # Module is configured; the HttpClient was constructed with the right flag.
        assert TurboWebhooks._client is not None
        # sender_email was not supplied; constructor would have raised
        # ValidationError if skip_sender_validation weren't True. Test passes
        # by virtue of no exception being raised.

    def test_configure_with_custom_base_url(self):
        TurboWebhooks.configure(
            api_key=API_KEY,
            org_id=ORG_ID,
            base_url="http://localhost:3000",
        )
        assert TurboWebhooks._client.base_url == "http://localhost:3000"

    def test_configure_without_api_key_raises(self):
        with pytest.raises(AuthenticationError, match="API key"):
            TurboWebhooks.configure(api_key=None, org_id=ORG_ID)

    def test_configure_without_org_id_raises(self):
        with pytest.raises(AuthenticationError, match="Organization"):
            TurboWebhooks.configure(api_key=API_KEY, org_id=None)


class TestLazyAutoConfigure:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_get_client_auto_configures_from_env(self):
        os.environ["TURBODOCX_API_KEY"] = "TDX-env-key"
        os.environ["TURBODOCX_ORG_ID"] = "env-org-id"

        client = TurboWebhooks._get_client()

        assert client is not None
        assert client.api_key == "TDX-env-key"
        assert client.org_id == "env-org-id"

    def test_get_client_raises_when_no_env(self):
        with pytest.raises(RuntimeError, match="not configured"):
            TurboWebhooks._get_client()


# ============================================
# CRUD
# ============================================


class TestCreateWebhook:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_create_webhook_unwraps_envelope(self):
        envelope = {
            "data": {"id": "wh-1", "secret": "whsec_abc123"},
            "message": "Webhook created successfully.",
        }
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=envelope)
            mock_get.return_value = mock_client

            result = await TurboWebhooks.create_webhook(
                name="my-hook",
                urls=["https://example.com/sink"],
                events=["signature.document.completed"],
            )

            assert result == {"id": "wh-1", "secret": "whsec_abc123"}
            mock_client.post.assert_called_once_with(
                "/api/webhooks",
                data={
                    "name": "my-hook",
                    "urls": ["https://example.com/sink"],
                    "events": ["signature.document.completed"],
                },
            )


class TestListWebhooks:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_list_no_filters(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(
                return_value={"results": [], "totalRecords": 0, "limit": 25, "offset": 0}
            )
            mock_get.return_value = mock_client

            result = await TurboWebhooks.list_webhooks()

            assert result["totalRecords"] == 0
            mock_client.get.assert_called_once_with("/api/webhooks")

    @pytest.mark.asyncio
    async def test_list_with_filters_serializes_query_string(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value={"results": []})
            mock_get.return_value = mock_client

            await TurboWebhooks.list_webhooks(
                limit=10, offset=20, name="prefix-", is_active=False
            )

            # is_active=False becomes "false" lowercase per _build_query_string
            mock_client.get.assert_called_once()
            called_with = mock_client.get.call_args[0][0]
            assert called_with.startswith("/api/webhooks?")
            assert "limit=10" in called_with
            assert "offset=20" in called_with
            assert "name=prefix-" in called_with
            assert "isActive=false" in called_with


class TestGetWebhook:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_get_webhook(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(
                return_value={
                    "id": "wh-1",
                    "name": "my-hook",
                    "deliveryStats": {"totalDeliveries": 0},
                    "availableEvents": ["signature.document.completed"],
                }
            )
            mock_get.return_value = mock_client

            result = await TurboWebhooks.get_webhook("my-hook")

            assert result["deliveryStats"]["totalDeliveries"] == 0
            mock_client.get.assert_called_once_with("/api/webhooks/my-hook")

    @pytest.mark.asyncio
    async def test_get_webhook_url_encodes_name(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value={})
            mock_get.return_value = mock_client

            await TurboWebhooks.get_webhook("my hook/with spaces")

            mock_client.get.assert_called_once_with(
                "/api/webhooks/my%20hook%2Fwith%20spaces"
            )


class TestUpdateWebhook:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_update_webhook_unwraps_envelope(self):
        envelope = {
            "data": {"id": "wh-1", "name": "my-hook", "isActive": False},
            "message": "Webhook updated successfully",
        }
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=envelope)
            mock_get.return_value = mock_client

            result = await TurboWebhooks.update_webhook("my-hook", is_active=False)

            assert result["isActive"] is False
            mock_client.patch.assert_called_once_with(
                "/api/webhooks/my-hook", data={"isActive": False}
            )


class TestDeleteWebhook:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_delete_webhook(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(
                return_value={"message": "Webhook deleted successfully"}
            )
            mock_get.return_value = mock_client

            result = await TurboWebhooks.delete_webhook("my-hook")

            assert "deleted" in result["message"].lower()
            mock_client.delete.assert_called_once_with("/api/webhooks/my-hook")


# ============================================
# TEST / NOTIFY
# ============================================


class TestTestWebhook:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_test_webhook_unwraps_envelope(self):
        envelope = {
            "data": {"deliveries": [], "summary": {"total": 1, "successful": 1, "failed": 0}},
            "message": "Test webhook sent successfully to all URLs",
        }
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=envelope)
            mock_get.return_value = mock_client

            result = await TurboWebhooks.test_webhook(
                "my-hook",
                event_type="signature.document.completed",
                payload={"documentId": "doc-1"},
            )

            assert result["summary"]["successful"] == 1
            mock_client.post.assert_called_once_with(
                "/api/webhooks/my-hook/test",
                data={
                    "eventType": "signature.document.completed",
                    "payload": {"documentId": "doc-1"},
                },
            )


class TestNotifyWebhook:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_notify_webhook_unwraps_envelope(self):
        envelope = {
            "data": {"deliveries": [], "summary": {"total": 1, "successful": 1, "failed": 0}},
            "message": "Manual notification sent successfully to all URLs",
        }
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=envelope)
            mock_get.return_value = mock_client

            result = await TurboWebhooks.notify_webhook(
                "my-hook",
                event_type="signature.document.completed",
                payload={"documentId": "doc-2"},
            )

            assert result["summary"]["successful"] == 1
            mock_client.post.assert_called_once_with(
                "/api/webhooks/my-hook/notify",
                data={
                    "eventType": "signature.document.completed",
                    "payload": {"documentId": "doc-2"},
                },
            )


# ============================================
# DELIVERIES + REPLAY
# ============================================


class TestListDeliveries:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_list_deliveries_with_filters(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value={"results": []})
            mock_get.return_value = mock_client

            await TurboWebhooks.list_webhook_deliveries(
                "my-hook", limit=10, is_delivered=False
            )

            called_with = mock_client.get.call_args[0][0]
            assert called_with.startswith("/api/webhooks/my-hook/deliveries?")
            assert "limit=10" in called_with
            assert "isDelivered=false" in called_with


class TestReplayDelivery:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_replay_unwraps_envelope(self):
        envelope = {
            "data": {"id": "delivery-1", "httpStatus": 200, "message": "Delivery replayed"},
            "message": "Delivery replayed",
        }
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=envelope)
            mock_get.return_value = mock_client

            result = await TurboWebhooks.replay_webhook_delivery("my-hook", "delivery-1")

            assert result["httpStatus"] == 200
            mock_client.post.assert_called_once_with(
                "/api/webhooks/my-hook/replay", data={"deliveryId": "delivery-1"}
            )


# ============================================
# SECRET ROTATION + STATS
# ============================================


class TestRegenerateSecret:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_regenerate_unwraps_envelope(self):
        envelope = {
            "data": {
                "id": "wh-1",
                "secret": "whsec_newRotated",
                "regeneratedAt": "2026-05-13T12:00:00Z",
                "message": "Webhook secret regenerated successfully.",
            },
            "message": "Webhook secret regenerated successfully.",
        }
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=envelope)
            mock_get.return_value = mock_client

            result = await TurboWebhooks.regenerate_webhook_secret("my-hook")

            assert result["secret"] == "whsec_newRotated"
            mock_client.post.assert_called_once_with(
                "/api/webhooks/my-hook/regenerate", data=None
            )


class TestWebhookStats:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_stats_with_days(self):
        stats_response = {
            "webhook": {"id": "wh-1", "name": "my-hook"},
            "period": {"days": 7, "from": "2026-05-06", "to": "2026-05-13"},
            "summary": {
                "totalDeliveries": 100,
                "successRate": 95,
                "avgResponseTime": 234,
            },
            "eventBreakdown": [],
        }
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=stats_response)
            mock_get.return_value = mock_client

            result = await TurboWebhooks.get_webhook_stats("my-hook", days=7)

            assert result["summary"]["successRate"] == 95
            assert result["period"]["from"] == "2026-05-06"
            mock_client.get.assert_called_once_with("/api/webhooks/my-hook/stats?days=7")


# ============================================
# ERROR PROPAGATION
# ============================================


class TestErrorPropagation:
    def setup_method(self):
        _reset()

    @pytest.mark.asyncio
    async def test_propagates_authentication_error_on_401(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(
                side_effect=AuthenticationError("Invalid API key")
            )
            mock_get.return_value = mock_client

            with pytest.raises(AuthenticationError):
                await TurboWebhooks.list_webhooks()

    @pytest.mark.asyncio
    async def test_propagates_authorization_error_on_403(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(side_effect=AuthorizationError("Forbidden"))
            mock_get.return_value = mock_client

            with pytest.raises(AuthorizationError):
                await TurboWebhooks.list_webhooks()

    @pytest.mark.asyncio
    async def test_propagates_not_found_error_on_404(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(side_effect=NotFoundError("Webhook not found"))
            mock_get.return_value = mock_client

            with pytest.raises(NotFoundError):
                await TurboWebhooks.get_webhook("missing")

    @pytest.mark.asyncio
    async def test_propagates_validation_error_on_400(self):
        with patch.object(TurboWebhooks, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(
                side_effect=ValidationError("All webhook URLs must use HTTPS")
            )
            mock_get.return_value = mock_client

            with pytest.raises(ValidationError):
                await TurboWebhooks.create_webhook(
                    name="bad",
                    urls=["http://insecure.example.com"],
                    events=["signature.document.completed"],
                )


# ============================================
# HMAC HELPER
# ============================================


class TestVerifyWebhookSignature:
    SECRET = "whsec_test_secret_xyz"
    BODY = '{"event":"signature.document.completed","documentId":"doc-1"}'
    NOW_SECONDS = 1747000000
    TIMESTAMP = str(NOW_SECONDS)

    def _sign(self, body, timestamp, secret):
        signed = f"{timestamp}.{body}".encode("utf-8")
        return "sha256=" + hmac.new(secret.encode("utf-8"), signed, sha256).hexdigest()

    def test_accepts_valid_signature_within_window(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert verify_webhook_signature(
            self.BODY, sig, self.TIMESTAMP, self.SECRET, now=lambda: self.NOW_SECONDS
        )

    def test_rejects_tampered_body(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert not verify_webhook_signature(
            self.BODY + "tampered",
            sig,
            self.TIMESTAMP,
            self.SECRET,
            now=lambda: self.NOW_SECONDS,
        )

    def test_rejects_tampered_timestamp(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert not verify_webhook_signature(
            self.BODY,
            sig,
            str(self.NOW_SECONDS + 1),
            self.SECRET,
            now=lambda: self.NOW_SECONDS + 1,
        )

    def test_rejects_stale_timestamp(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert not verify_webhook_signature(
            self.BODY,
            sig,
            self.TIMESTAMP,
            self.SECRET,
            now=lambda: self.NOW_SECONDS + 301,
        )

    def test_rejects_future_timestamp(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert not verify_webhook_signature(
            self.BODY,
            sig,
            self.TIMESTAMP,
            self.SECRET,
            now=lambda: self.NOW_SECONDS - 301,
        )

    def test_zero_tolerance_disables_check(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert verify_webhook_signature(
            self.BODY,
            sig,
            self.TIMESTAMP,
            self.SECRET,
            tolerance_seconds=0,
            now=lambda: self.NOW_SECONDS + 99999,
        )

    def test_rejects_missing_signature(self):
        assert not verify_webhook_signature(self.BODY, "", self.TIMESTAMP, self.SECRET)

    def test_rejects_missing_timestamp(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert not verify_webhook_signature(self.BODY, sig, "", self.SECRET)

    def test_rejects_missing_secret(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert not verify_webhook_signature(self.BODY, sig, self.TIMESTAMP, "")

    def test_rejects_non_numeric_timestamp(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert not verify_webhook_signature(
            self.BODY,
            sig,
            "not-a-number",
            self.SECRET,
            now=lambda: self.NOW_SECONDS,
        )

    def test_rejects_length_mismatched_signature(self):
        assert not verify_webhook_signature(
            self.BODY,
            "sha256=short",
            self.TIMESTAMP,
            self.SECRET,
            now=lambda: self.NOW_SECONDS,
        )

    def test_accepts_bytes_body(self):
        sig = self._sign(self.BODY, self.TIMESTAMP, self.SECRET)
        assert verify_webhook_signature(
            self.BODY.encode("utf-8"),
            sig,
            self.TIMESTAMP,
            self.SECRET,
            now=lambda: self.NOW_SECONDS,
        )
