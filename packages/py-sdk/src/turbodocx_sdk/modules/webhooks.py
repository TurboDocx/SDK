"""
TurboWebhooks Module - Org-scoped webhook subscription management

Wraps the backend /api/webhooks/* surface. All routes require an admin
TDX- API key. Webhook management does not send signature emails, so the
HttpClient is constructed with skip_sender_validation=True.

POST/PATCH responses come back as `{"data": ..., "message": ...}` envelopes
which the HttpClient's _smart_unwrap leaves intact (it only unwraps single-key
`{"data": ...}` responses). Methods that hit non-GET routes therefore extract
`.data` explicitly. GET routes are auto-unwrapped.
"""

import os
from typing import Any, Dict, List, Optional
from urllib.parse import quote, urlencode

from ..http import HttpClient


def _build_query_string(params: Dict[str, Any]) -> str:
    """Build URL query string from non-None parameters. Booleans lowercased."""
    filtered = {k: v for k, v in params.items() if v is not None}
    if not filtered:
        return ""
    for k, v in filtered.items():
        if isinstance(v, bool):
            filtered[k] = str(v).lower()
    return "?" + urlencode(filtered)


class TurboWebhooks:
    """TurboWebhooks module for managing webhook subscriptions."""

    _client: Optional[HttpClient] = None

    @classmethod
    def configure(
        cls,
        api_key: Optional[str] = None,
        org_id: Optional[str] = None,
        base_url: str = "https://api.turbodocx.com",
    ) -> None:
        """
        Configure the TurboWebhooks module with API credentials.

        Args:
            api_key: TurboDocx API key (must be administrator role)
            org_id: Organization ID
            base_url: API base URL (defaults to https://api.turbodocx.com)

        Example:
            >>> TurboWebhooks.configure(
            ...     api_key=os.environ["TURBODOCX_API_KEY"],
            ...     org_id=os.environ["TURBODOCX_ORG_ID"],
            ... )
        """
        cls._client = HttpClient(
            api_key=api_key,
            org_id=org_id,
            base_url=base_url,
            skip_sender_validation=True,
        )

    @classmethod
    def _get_client(cls) -> HttpClient:
        """
        Get the HTTP client. Auto-configures from env vars if not yet configured.
        Mirrors TurboPartner's behavior: explicit env-var check with a clear
        error rather than silent auto-configure.
        """
        if cls._client is None:
            api_key = os.environ.get("TURBODOCX_API_KEY")
            org_id = os.environ.get("TURBODOCX_ORG_ID")
            if not api_key or not org_id:
                raise RuntimeError(
                    "TurboWebhooks not configured. Call TurboWebhooks.configure("
                    "api_key='...', org_id='...') first, or set "
                    "TURBODOCX_API_KEY and TURBODOCX_ORG_ID environment variables."
                )
            cls.configure(api_key=api_key, org_id=org_id)
        return cls._client  # type: ignore[return-value]

    @staticmethod
    def _encode_name(name: str) -> str:
        """URL-encode a webhook name for path interpolation. safe='' encodes /."""
        return quote(name, safe="")

    # ============================================
    # CRUD
    # ============================================

    @classmethod
    async def create_webhook(
        cls,
        name: str,
        urls: List[str],
        events: List[str],
    ) -> Dict[str, Any]:
        """
        Create a webhook subscription.

        Args:
            name: Unique webhook name within the org
            urls: List of HTTPS URLs to deliver events to (HTTP returns 400)
            events: List of event types (e.g. "signature.document.completed")

        Returns:
            Dict with `id` and `secret`. The `secret` is shown ONCE; store it
            immediately on receipt.

        Raises:
            ValidationError: if URLs are not HTTPS or events are unknown
            AuthorizationError: if the API key lacks admin role
        """
        envelope = await cls._get_client().post(
            "/api/webhooks",
            data={"name": name, "urls": urls, "events": events},
        )
        return envelope["data"]

    @classmethod
    async def list_webhooks(
        cls,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        name: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        List webhook subscriptions for the configured org.

        Returns:
            Dict with `results` (list of webhook dicts including delivery
            aggregates), `totalRecords`, `limit`, `offset`.
        """
        qs = _build_query_string(
            {"limit": limit, "offset": offset, "name": name, "isActive": is_active}
        )
        return await cls._get_client().get(f"/api/webhooks{qs}")

    @classmethod
    async def get_webhook(cls, name: str) -> Dict[str, Any]:
        """
        Get a single webhook by name with current delivery stats and
        the server-provided list of subscribable events.
        """
        return await cls._get_client().get(
            f"/api/webhooks/{cls._encode_name(name)}"
        )

    @classmethod
    async def update_webhook(
        cls,
        name: str,
        *,
        new_name: Optional[str] = None,
        urls: Optional[List[str]] = None,
        events: Optional[List[str]] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Patch one or more fields on an existing webhook.

        Args:
            name: The CURRENT webhook name (used in URL path)
            new_name: New name to rename to (optional)
            urls: New URL list (optional, HTTPS only)
            events: New event subscription list (optional)
            is_active: Enable/disable the webhook (optional)
        """
        body: Dict[str, Any] = {}
        if new_name is not None:
            body["name"] = new_name
        if urls is not None:
            body["urls"] = urls
        if events is not None:
            body["events"] = events
        if is_active is not None:
            body["isActive"] = is_active

        envelope = await cls._get_client().patch(
            f"/api/webhooks/{cls._encode_name(name)}",
            data=body,
        )
        return envelope["data"]

    @classmethod
    async def delete_webhook(cls, name: str) -> Dict[str, Any]:
        """Soft-delete a webhook and its delivery history."""
        return await cls._get_client().delete(
            f"/api/webhooks/{cls._encode_name(name)}"
        )

    # ============================================
    # TEST / NOTIFY
    # ============================================

    @classmethod
    async def test_webhook(
        cls,
        name: str,
        event_type: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Send a test delivery to all URLs configured on the webhook.

        Returns:
            Dict with `deliveries` (list) and `summary` (total/successful/failed).
        """
        envelope = await cls._get_client().post(
            f"/api/webhooks/{cls._encode_name(name)}/test",
            data={"eventType": event_type, "payload": payload},
        )
        return envelope["data"]

    @classmethod
    async def notify_webhook(
        cls,
        name: str,
        event_type: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Send a manual notification to all URLs configured on the webhook.

        NOTE: routes through the same backend handler as `test_webhook` and
        returns the same shape; the only wire-level difference is the response
        message string. Prefer `test_webhook` in new code.
        """
        envelope = await cls._get_client().post(
            f"/api/webhooks/{cls._encode_name(name)}/notify",
            data={"eventType": event_type, "payload": payload},
        )
        return envelope["data"]

    # ============================================
    # DELIVERIES + REPLAY
    # ============================================

    @classmethod
    async def list_webhook_deliveries(
        cls,
        name: str,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        event_type: Optional[str] = None,
        is_delivered: Optional[bool] = None,
        http_status: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List historical delivery attempts for a webhook, with optional filters."""
        qs = _build_query_string(
            {
                "limit": limit,
                "offset": offset,
                "eventType": event_type,
                "isDelivered": is_delivered,
                "httpStatus": http_status,
            }
        )
        return await cls._get_client().get(
            f"/api/webhooks/{cls._encode_name(name)}/deliveries{qs}"
        )

    @classmethod
    async def replay_webhook_delivery(
        cls,
        name: str,
        delivery_id: str,
    ) -> Dict[str, Any]:
        """Manually retry a specific past delivery by ID."""
        envelope = await cls._get_client().post(
            f"/api/webhooks/{cls._encode_name(name)}/replay",
            data={"deliveryId": delivery_id},
        )
        return envelope["data"]

    # ============================================
    # SECRET ROTATION + STATS
    # ============================================

    @classmethod
    async def regenerate_webhook_secret(cls, name: str) -> Dict[str, Any]:
        """
        Rotate the webhook's HMAC secret. The new secret is shown ONCE in the
        response and must be saved; old signatures will fail immediately.
        """
        envelope = await cls._get_client().post(
            f"/api/webhooks/{cls._encode_name(name)}/regenerate",
            data=None,
        )
        return envelope["data"]

    @classmethod
    async def get_webhook_stats(
        cls,
        name: str,
        *,
        days: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Aggregate delivery stats for the webhook over a sliding window."""
        qs = _build_query_string({"days": days})
        return await cls._get_client().get(
            f"/api/webhooks/{cls._encode_name(name)}/stats{qs}"
        )
