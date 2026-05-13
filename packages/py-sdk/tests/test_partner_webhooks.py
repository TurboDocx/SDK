"""
TurboPartner Webhook Management Tests

Tests for webhook provisioning operations:
- create_webhook
- list_webhooks
- get_webhook
- update_webhook
- delete_webhook
- test_webhook
- list_webhook_deliveries
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from turbodocx_sdk import TurboPartner


PARTNER_ID = "test-partner-id"
ORG_ID = "org-uuid-456"
WEBHOOK_NAME = "my-signing-webhook"

MOCK_WEBHOOK = {
    "id": "webhook-uuid-789",
    "name": WEBHOOK_NAME,
    "urls": ["https://example.com/hook"],
    "events": ["signature.document.completed"],
    "isActive": True,
    "createdOn": "2025-01-01T00:00:00.000Z",
    "updatedOn": "2025-01-01T00:00:00.000Z",
}


class TestCreateWebhook:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None
        TurboPartner.configure(partner_api_key="TDXP-test-key", partner_id=PARTNER_ID)

    @pytest.mark.asyncio
    async def test_create_webhook(self):
        mock_response = {"success": True, "data": {**MOCK_WEBHOOK, "secret": "whsec_abc"}}

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            result = await TurboPartner.create_webhook(
                org_id=ORG_ID,
                name=WEBHOOK_NAME,
                urls=["https://example.com/hook"],
                events=["signature.document.completed"],
            )

        assert result["success"] is True
        assert result["data"]["name"] == WEBHOOK_NAME
        assert result["data"]["secret"] == "whsec_abc"
        mock_client.post.assert_called_once_with(
            f"/partner/{PARTNER_ID}/orgs/{ORG_ID}/webhooks",
            data={
                "name": WEBHOOK_NAME,
                "urls": ["https://example.com/hook"],
                "events": ["signature.document.completed"],
            },
        )

    @pytest.mark.asyncio
    async def test_create_webhook_with_metadata(self):
        mock_response = {"success": True, "data": MOCK_WEBHOOK}

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            await TurboPartner.create_webhook(
                org_id=ORG_ID,
                name=WEBHOOK_NAME,
                urls=["https://example.com/hook"],
                events=["signature.document.completed"],
                metadata={"env": "production"},
            )

        call_data = mock_client.post.call_args[1]["data"]
        assert call_data["metadata"] == {"env": "production"}


class TestListWebhooks:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None
        TurboPartner.configure(partner_api_key="TDXP-test-key", partner_id=PARTNER_ID)

    @pytest.mark.asyncio
    async def test_list_webhooks_no_params(self):
        mock_response = {
            "success": True,
            "data": {"results": [MOCK_WEBHOOK], "totalRecords": 1, "limit": 50, "offset": 0},
        }

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            result = await TurboPartner.list_webhooks(org_id=ORG_ID)

        assert result["success"] is True
        assert len(result["data"]["results"]) == 1
        mock_client.get.assert_called_once_with(
            f"/partner/{PARTNER_ID}/orgs/{ORG_ID}/webhooks"
        )

    @pytest.mark.asyncio
    async def test_list_webhooks_with_pagination(self):
        mock_response = {
            "success": True,
            "data": {"results": [], "totalRecords": 0, "limit": 10, "offset": 20},
        }

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            await TurboPartner.list_webhooks(org_id=ORG_ID, limit=10, offset=20)

        mock_client.get.assert_called_once_with(
            f"/partner/{PARTNER_ID}/orgs/{ORG_ID}/webhooks?limit=10&offset=20"
        )

    @pytest.mark.asyncio
    async def test_list_webhooks_filter_by_active(self):
        mock_response = {
            "success": True,
            "data": {"results": [], "totalRecords": 0, "limit": 50, "offset": 0},
        }

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            await TurboPartner.list_webhooks(org_id=ORG_ID, is_active=True)

        url = mock_client.get.call_args[0][0]
        assert "is_active=true" in url


class TestGetWebhook:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None
        TurboPartner.configure(partner_api_key="TDXP-test-key", partner_id=PARTNER_ID)

    @pytest.mark.asyncio
    async def test_get_webhook(self):
        mock_response = {"success": True, "data": MOCK_WEBHOOK}

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            result = await TurboPartner.get_webhook(org_id=ORG_ID, webhook_name=WEBHOOK_NAME)

        assert result["success"] is True
        assert result["data"]["name"] == WEBHOOK_NAME
        mock_client.get.assert_called_once_with(
            f"/partner/{PARTNER_ID}/orgs/{ORG_ID}/webhooks/{WEBHOOK_NAME}"
        )


class TestUpdateWebhook:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None
        TurboPartner.configure(partner_api_key="TDXP-test-key", partner_id=PARTNER_ID)

    @pytest.mark.asyncio
    async def test_update_webhook_is_active(self):
        mock_response = {"success": True, "data": {**MOCK_WEBHOOK, "isActive": False}}

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            result = await TurboPartner.update_webhook(
                org_id=ORG_ID, webhook_name=WEBHOOK_NAME, is_active=False
            )

        assert result["data"]["isActive"] is False
        mock_client.patch.assert_called_once_with(
            f"/partner/{PARTNER_ID}/orgs/{ORG_ID}/webhooks/{WEBHOOK_NAME}",
            data={"isActive": False},
        )

    @pytest.mark.asyncio
    async def test_update_webhook_urls_and_events(self):
        updated = {**MOCK_WEBHOOK, "urls": ["https://new.example.com/hook"]}
        mock_response = {"success": True, "data": updated}

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            await TurboPartner.update_webhook(
                org_id=ORG_ID,
                webhook_name=WEBHOOK_NAME,
                urls=["https://new.example.com/hook"],
            )

        call_data = mock_client.patch.call_args[1]["data"]
        assert call_data["urls"] == ["https://new.example.com/hook"]


class TestDeleteWebhook:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None
        TurboPartner.configure(partner_api_key="TDXP-test-key", partner_id=PARTNER_ID)

    @pytest.mark.asyncio
    async def test_delete_webhook(self):
        mock_response = {"success": True, "message": "Webhook deleted"}

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            result = await TurboPartner.delete_webhook(
                org_id=ORG_ID, webhook_name=WEBHOOK_NAME
            )

        assert result["success"] is True
        mock_client.delete.assert_called_once_with(
            f"/partner/{PARTNER_ID}/orgs/{ORG_ID}/webhooks/{WEBHOOK_NAME}"
        )


class TestTestWebhook:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None
        TurboPartner.configure(partner_api_key="TDXP-test-key", partner_id=PARTNER_ID)

    @pytest.mark.asyncio
    async def test_test_webhook_default(self):
        mock_response = {
            "success": True,
            "data": {"deliveries": [], "summary": {"total": 1, "successful": 1, "failed": 0, "errors": []}},
        }

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            result = await TurboPartner.test_webhook(
                org_id=ORG_ID, webhook_name=WEBHOOK_NAME
            )

        assert result["data"]["summary"]["successful"] == 1
        mock_client.post.assert_called_once_with(
            f"/partner/{PARTNER_ID}/orgs/{ORG_ID}/webhooks/{WEBHOOK_NAME}/test",
            data={},
        )

    @pytest.mark.asyncio
    async def test_test_webhook_with_event_override(self):
        mock_response = {
            "success": True,
            "data": {"deliveries": [], "summary": {"total": 1, "successful": 1, "failed": 0, "errors": []}},
        }

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            await TurboPartner.test_webhook(
                org_id=ORG_ID,
                webhook_name=WEBHOOK_NAME,
                event="signature.document.voided",
                data={"doc": "123"},
            )

        call_data = mock_client.post.call_args[1]["data"]
        assert call_data["event"] == "signature.document.voided"
        assert call_data["data"] == {"doc": "123"}


class TestListWebhookDeliveries:
    def setup_method(self):
        TurboPartner._client = None
        TurboPartner._partner_id = None
        TurboPartner.configure(partner_api_key="TDXP-test-key", partner_id=PARTNER_ID)

    @pytest.mark.asyncio
    async def test_list_webhook_deliveries(self):
        mock_delivery = {
            "id": "del-1",
            "webhookId": "webhook-uuid-789",
            "event": "signature.document.completed",
            "statusCode": 200,
            "success": True,
            "attemptCount": 1,
            "createdOn": "2025-01-01T00:00:00.000Z",
        }
        mock_response = {
            "success": True,
            "data": {"results": [mock_delivery], "totalRecords": 1, "limit": 50, "offset": 0},
        }

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            result = await TurboPartner.list_webhook_deliveries(
                org_id=ORG_ID, webhook_name=WEBHOOK_NAME
            )

        assert len(result["data"]["results"]) == 1
        mock_client.get.assert_called_once_with(
            f"/partner/{PARTNER_ID}/orgs/{ORG_ID}/webhooks/{WEBHOOK_NAME}/deliveries"
        )

    @pytest.mark.asyncio
    async def test_list_webhook_deliveries_with_pagination(self):
        mock_response = {
            "success": True,
            "data": {"results": [], "totalRecords": 0, "limit": 10, "offset": 5},
        }

        with patch.object(TurboPartner, "_get_client") as mock_get:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get.return_value = mock_client

            await TurboPartner.list_webhook_deliveries(
                org_id=ORG_ID, webhook_name=WEBHOOK_NAME, limit=10, offset=5
            )

        url = mock_client.get.call_args[0][0]
        assert "limit=10" in url
        assert "offset=5" in url
