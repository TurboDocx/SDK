"""
TurboWebhooks Module - Org-scoped signature webhook subscription

The SDK is intentionally locked to a single webhook per org, identified by
the fixed name `signature`. This matches the UI's Signature Webhooks
settings page so SDK-managed and UI-managed webhooks stay in sync. To
manage multiple webhooks per org, call the REST API directly.

All routes require an admin TDX- API key. Webhook management does not
send signature emails, so HttpClient is constructed with
skip_sender_validation=True.

POST/PATCH responses come back as `{"data": ..., "message": ...}` envelopes
which the HttpClient's _smart_unwrap leaves intact (it only unwraps
single-key `{"data": ...}` responses). Methods that hit non-GET routes
extract `.data` explicitly. GET routes are auto-unwrapped.
"""

import os
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

from ..http import HttpClient, AuthenticationError


SIGNATURE_WEBHOOK_NAME = "signature"


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
    """TurboWebhooks module for managing the org's signature webhook."""

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
        client = HttpClient(
            api_key=api_key,
            org_id=org_id,
            base_url=base_url,
            skip_sender_validation=True,
        )
        # Webhook routes are org-scoped and admin-gated — org_id is required
        # (HttpClient leaves it optional for TurboSign).
        if client.org_id is None:
            raise AuthenticationError(
                "Organization ID (org_id) is required for authentication"
            )
        cls._client = client

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

    # ============================================
    # CRUD - always hits /api/webhooks/signature[/...]
    # ============================================

    @classmethod
    async def create_webhook(
        cls,
        urls: List[str],
        events: List[str],
    ) -> Dict[str, Any]:
        """
        Create the org's signature webhook.

        Args:
            urls: List of HTTPS URLs to deliver events to (HTTP returns 400).
                Min 1, max 10.
            events: List of event types. Min 1. Prefer the exported constants
                (WEBHOOK_EVENT_COMPLETED, WEBHOOK_EVENT_RECIPIENT_SIGNED, ...)
                over raw strings; WEBHOOK_EVENTS holds all 7. Plain strings are
                still accepted so new backend events work without an SDK bump.

        Returns:
            Dict with `id` and `secret`. The `secret` is shown ONCE; store it
            immediately on receipt.

        Raises:
            ValidationError: if URLs are not HTTPS (HTTP 400)
            ConflictError: if a webhook with this name already exists (HTTP 409)
            AuthorizationError: if the API key lacks admin role
        """
        envelope = await cls._get_client().post(
            "/api/webhooks",
            data={"name": SIGNATURE_WEBHOOK_NAME, "urls": urls, "events": events},
        )
        return envelope["data"]

    @classmethod
    async def get_webhook(cls) -> Dict[str, Any]:
        """
        Get the org's signature webhook with delivery stats + the server-
        provided list of subscribable events.
        """
        return await cls._get_client().get(
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}"
        )

    @classmethod
    async def update_webhook(
        cls,
        *,
        urls: Optional[List[str]] = None,
        events: Optional[List[str]] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Patch one or more fields on the signature webhook.

        Renaming is not supported — the SDK manages a fixed name.

        `urls` and `events` are optional, but they still enforce their minimums
        when present: passing an empty list is a 400. Leave the argument as None
        to leave the field untouched. `urls` also caps at 10 entries.
        """
        body: Dict[str, Any] = {}
        if urls is not None:
            body["urls"] = urls
        if events is not None:
            body["events"] = events
        if is_active is not None:
            body["isActive"] = is_active

        envelope = await cls._get_client().patch(
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}",
            data=body,
        )
        return envelope["data"]

    @classmethod
    async def delete_webhook(cls) -> Dict[str, Any]:
        """Soft-delete the signature webhook and its delivery history."""
        return await cls._get_client().delete(
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}"
        )

    # ============================================
    # TEST / NOTIFY
    # ============================================

    @classmethod
    async def test_webhook(
        cls,
        event_type: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Send a test delivery to all URLs configured on the signature webhook.

        Returns:
            Dict with `deliveries` (list) and `summary` (total/successful/failed).
        """
        envelope = await cls._get_client().post(
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}/test",
            data={"eventType": event_type, "payload": payload},
        )
        return envelope["data"]

    @classmethod
    async def notify_webhook(
        cls,
        event_type: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Send a manual notification to all URLs configured on the signature
        webhook.

        NOTE: routes through the same backend handler as `test_webhook` and
        returns the same shape; the only wire-level difference is the response
        message string. Prefer `test_webhook` in new code.
        """
        envelope = await cls._get_client().post(
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}/notify",
            data={"eventType": event_type, "payload": payload},
        )
        return envelope["data"]

    # ============================================
    # DELIVERIES + REPLAY
    # ============================================

    @classmethod
    async def list_webhook_deliveries(
        cls,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        event_type: Optional[str] = None,
        is_delivered: Optional[bool] = None,
        http_status: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List historical delivery attempts for the signature webhook."""
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
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}/deliveries{qs}"
        )

    @classmethod
    async def replay_webhook_delivery(
        cls,
        delivery_id: str,
    ) -> Dict[str, Any]:
        """Manually retry a specific past delivery by ID."""
        envelope = await cls._get_client().post(
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}/replay",
            data={"deliveryId": delivery_id},
        )
        return envelope["data"]

    # ============================================
    # SECRET ROTATION + STATS
    # ============================================

    @classmethod
    async def regenerate_webhook_secret(cls) -> Dict[str, Any]:
        """
        Rotate the webhook's HMAC secret. The new secret is shown ONCE in the
        response and must be saved; old signatures will fail immediately.
        """
        envelope = await cls._get_client().post(
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}/regenerate",
            data=None,
        )
        return envelope["data"]

    @classmethod
    async def get_webhook_stats(
        cls,
        *,
        days: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Aggregate delivery stats for the webhook over a sliding window."""
        qs = _build_query_string({"days": days})
        return await cls._get_client().get(
            f"/api/webhooks/{SIGNATURE_WEBHOOK_NAME}/stats{qs}"
        )
