"""
TurboWebhooks CRUD example.

Walks through the full lifecycle plus the error paths you actually hit
in practice:

  1. configure() against the TurboDocx API
  2. create the signature webhook
  3. trigger the conflict path (second create with the same name → 409)
  4. read (get) the webhook + its delivery stats
  5. update its URL list and confirm the change
  6. test-fire it (and surface per-URL failure strings)
  7. rotate its secret
  8. list past delivery attempts
  9. delete it
 10. confirm reads against the now-deleted webhook return 404

Run:

  export TURBODOCX_API_KEY=TDX-...
  export TURBODOCX_ORG_ID=...
  python examples/turbowebhooks_crud.py

Optionally override the API host with TURBODOCX_BASE_URL, and the
delivery target with TURBODOCX_RECEIVER_URL (e.g. a webhook.site or
ngrok URL) when live-testing.

Requires an admin-scoped TDX- API key. The webhook route gate is
requireOrgRole(administrator); a non-admin key will 403 here.
"""

import asyncio
import os
from datetime import datetime, timezone

from turbodocx_sdk import (
    TurboWebhooks,
    WEBHOOK_EVENT_COMPLETED,
    WEBHOOK_EVENT_VOIDED,
    AuthenticationError,
    AuthorizationError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    ConflictError,
    NetworkError,
    TurboDocxError,
)


# The URL the webhook will POST to when an event fires. The backend
# enforces HTTPS-only — non-HTTPS URLs return 400 ValidationError.
#
# Override via TURBODOCX_RECEIVER_URL when live-testing against an actual
# receiver (e.g. webhook.site, ngrok).
RECEIVER_URL = os.environ.get(
    "TURBODOCX_RECEIVER_URL",
    "https://your-server.example.com/webhooks/turbodocx",
)

# The SDK exports all 7 signature events as WEBHOOK_EVENT_* constants (plus a
# WEBHOOK_EVENTS tuple of every wire string). See the README for what each one
# fires on — note that `signed` is partial-progress only and never fires on the
# final signature; use `completed` to detect "the document is done".
EVENT_DOCUMENT_COMPLETED = WEBHOOK_EVENT_COMPLETED
EVENT_DOCUMENT_VOIDED = WEBHOOK_EVENT_VOIDED


def section(title: str) -> None:
    print("")
    print("─" * 60)
    print(f"▸ {title}")
    print("─" * 60)


def pretty(value) -> str:
    import json

    try:
        return json.dumps(value, indent=2, default=str)
    except (TypeError, ValueError):
        return "<unserializable>"


async def turbowebhooks_crud_example() -> None:
    # Configure the TurboWebhooks client. skip_sender_validation is
    # hardcoded inside TurboWebhooks.configure() because webhooks don't
    # send emails — only TurboSign needs a sender_email.
    base_url = os.environ.get("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
    org_id = os.environ.get("TURBODOCX_ORG_ID", "your-org-id-here")

    TurboWebhooks.configure(
        api_key=os.environ.get("TURBODOCX_API_KEY", "your-admin-tdx-key-here"),
        org_id=org_id,
        base_url=base_url,
    )

    print(f"Configured TurboWebhooks against {base_url}")
    print(f"Org: {org_id}")

    # ────────────────────────────────────────────────────────────
    # 1. CREATE
    # ────────────────────────────────────────────────────────────
    section("CREATE webhook")

    try:
        created = await TurboWebhooks.create_webhook(
            urls=[RECEIVER_URL],
            events=[EVENT_DOCUMENT_COMPLETED, EVENT_DOCUMENT_VOIDED],
        )
        print("Created. Save this secret — it is shown ONCE:")
        print(f"  id:     {created['id']}")
        print(f"  secret: {created['secret']}")
    except ConflictError:
        # The webhook already exists from a previous run. That's fine —
        # continue with the rest of the example so you can still exercise
        # update / test / delete. Any other error bubbles to the top-level
        # handler below where each branch has its own dedicated message.
        print("A signature webhook already exists for this org (409). Continuing.")

    # ────────────────────────────────────────────────────────────
    # 2. CONFLICT PATH — create again, expect 409
    # ────────────────────────────────────────────────────────────
    section("Trigger duplicate-name conflict (expect 409)")

    try:
        await TurboWebhooks.create_webhook(
            urls=[RECEIVER_URL],
            events=[EVENT_DOCUMENT_COMPLETED],
        )
        print(
            "Unexpected: second create succeeded. Did the webhook get deleted between calls?"
        )
    except ConflictError as e:
        print("Got the expected 409 ConflictError.")
        print(f"  message:    {e}")
        print(f"  statusCode: {getattr(e, 'status_code', None)}")
        print(f"  code:       {getattr(e, 'code', None)}")

    # ────────────────────────────────────────────────────────────
    # 3. READ
    # ────────────────────────────────────────────────────────────
    section("GET webhook")

    webhook = await TurboWebhooks.get_webhook()
    print("Webhook:")
    print(f"  id:        {webhook.get('id')}")
    print(f"  name:      {webhook.get('name')}")
    print(f"  urls:      {pretty(webhook.get('urls'))}")
    print(f"  events:    {pretty(webhook.get('events'))}")
    print(f"  isActive:  {webhook.get('isActive')}")
    print(f"  stats:     {pretty(webhook.get('deliveryStats'))}")

    # ────────────────────────────────────────────────────────────
    # 4. UPDATE
    # ────────────────────────────────────────────────────────────
    section("UPDATE webhook (replace URL list)")

    updated = await TurboWebhooks.update_webhook(urls=[RECEIVER_URL])
    print(f"Updated. New URLs:\n{pretty(updated.get('urls'))}")

    # ────────────────────────────────────────────────────────────
    # 5. TEST FIRE — surface per-URL errors
    # ────────────────────────────────────────────────────────────
    section("TEST-fire webhook")

    try:
        result = await TurboWebhooks.test_webhook(
            event_type=EVENT_DOCUMENT_COMPLETED,
            payload={
                "documentId": "00000000-0000-0000-0000-000000000000",
                "documentName": "CRUD-example test fire",
                "completedAt": datetime.now(timezone.utc).isoformat(),
            },
        )
        summary = result["summary"]
        print(
            f"Summary: {summary['successful']}/{summary['total']} successful, "
            f"{summary['failed']} failed"
        )
        errors = summary.get("errors") or []
        if errors:
            print("Per-URL errors:")
            for err in errors:
                print(f"  - {err}")
    except TurboDocxError as e:
        print(f"Test-fire failed: {type(e).__name__} — {e}")

    # ────────────────────────────────────────────────────────────
    # 6. ROTATE SECRET
    # ────────────────────────────────────────────────────────────
    section("Rotate webhook secret")

    rotated = await TurboWebhooks.regenerate_webhook_secret()
    print("Rotated. New secret (shown ONCE, save it):")
    print(f"  secret:        {rotated['secret']}")
    print(f"  regeneratedAt: {rotated.get('regeneratedAt')}")

    # ────────────────────────────────────────────────────────────
    # 7. LIST DELIVERIES
    # ────────────────────────────────────────────────────────────
    section("List recent delivery attempts")

    deliveries = await TurboWebhooks.list_webhook_deliveries(limit=5)
    print(f"Total recorded: {deliveries.get('totalRecords')}")
    for i, d in enumerate(deliveries.get("results", [])):
        http_status = d.get("httpStatus") if d.get("httpStatus") is not None else "pending"
        delivered = "OK" if d.get("isDelivered") else "FAIL"
        print(f"  [{i}] {d.get('eventType')} → {http_status} ({delivered}) at {d.get('createdOn')}")

    # ────────────────────────────────────────────────────────────
    # 8. DELETE
    # ────────────────────────────────────────────────────────────
    section("DELETE webhook")

    del_result = await TurboWebhooks.delete_webhook()
    print(f"Deleted. Server says: {del_result.get('message')}")

    # ────────────────────────────────────────────────────────────
    # 9. POST-DELETE READ — expect 404
    # ────────────────────────────────────────────────────────────
    section("GET after delete (expect 404)")

    try:
        await TurboWebhooks.get_webhook()
        print("Unexpected: read after delete succeeded.")
    except NotFoundError as e:
        print(f"Got the expected 404 NotFoundError: {e}")


async def main() -> None:
    # Top-level error handler — catches anything the per-section blocks
    # didn't handle. Each branch is dedicated so the message tells you
    # exactly which class of failure occurred.
    try:
        await turbowebhooks_crud_example()
        print("\n✓ CRUD walkthrough complete.")
    except AuthenticationError as e:
        print(f"\n[401] Authentication failed: {e}")
        print("Check TURBODOCX_API_KEY. The webhook routes require an admin TDX- key.")
        raise SystemExit(1)
    except AuthorizationError as e:
        print(f"\n[403] Authorization failed: {e}")
        print("Webhook routes require the org administrator role.")
        raise SystemExit(1)
    except ValidationError as e:
        print(f"\n[400] Validation error: {e}")
        raise SystemExit(1)
    except NotFoundError as e:
        print(f"\n[404] Not found: {e}")
        raise SystemExit(1)
    except RateLimitError as e:
        print(f"\n[429] Rate limited: {e}")
        raise SystemExit(1)
    except ConflictError as e:
        print(f"\n[409] Conflict: {e}")
        raise SystemExit(1)
    except NetworkError as e:
        configured_base_url = os.environ.get("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
        print(f"\n[network] Could not reach the backend: {e}")
        print(f"Could not reach {configured_base_url}.")
        raise SystemExit(1)
    except TurboDocxError as e:
        status_label = getattr(e, "status_code", None)
        status_label = "?" if status_label is None else str(status_label)
        print(f"\n[{status_label}] {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
