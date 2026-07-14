"""
Types and constants for the TurboWebhooks module.

Exposes the 7 TurboSign webhook events as named constants, a `Literal` type
for static checking, and a `WEBHOOK_EVENTS` tuple of every wire string.

`create_webhook(events=...)` still accepts a plain `List[str]`, so the backend
can add events without an SDK release and existing code that passes raw
strings keeps working.
"""

from __future__ import annotations

from typing import Tuple
from typing_extensions import Literal

# ============================================
# The 7 signature events
# ============================================

WEBHOOK_EVENT_SENT = "signature.document.sent"
"""The document is dispatched to recipients."""

WEBHOOK_EVENT_VIEWED = "signature.document.viewed"
"""A recipient opens the document for the first time."""

WEBHOOK_EVENT_RECIPIENT_SIGNED = "signature.document.recipient_signed"
"""
Any individual signer completes their signature -- fires **once per signer**,
including the last one. The payload carries the signer's identity plus
``is_final_signer`` (true only on the last signature) and ``remaining_signers``.

This is the per-person event, and it always fires *before* the document-level
outcome (``signed``, ``completed``, or ``finalization_failed``).
"""

WEBHOOK_EVENT_SIGNED = "signature.document.signed"
"""
A signer signs but the document is **not yet complete** -- document-level
partial progress.

Two consequences worth internalizing:

- **It never fires on the final signature.** To detect "the whole document is
  done", use ``WEBHOOK_EVENT_COMPLETED`` (or ``WEBHOOK_EVENT_RECIPIENT_SIGNED``
  with ``is_final_signer: true``) -- NOT this event.
- **A single-signer document never emits it at all.** That document emits
  ``recipient_signed`` (``is_final_signer: true``) then ``completed``.
"""

WEBHOOK_EVENT_COMPLETED = "signature.document.completed"
"""All recipients have signed and the signed PDF is finalized."""

WEBHOOK_EVENT_FINALIZATION_FAILED = "signature.document.finalization_failed"
"""
The signed PDF fails to finalize (e.g. a KMS signing error). The document is
**not** completed -- this fires *instead of* ``completed`` on the final signature.
"""

WEBHOOK_EVENT_VOIDED = "signature.document.voided"
"""The document is voided or cancelled."""


WebhookEvent = Literal[
    "signature.document.sent",
    "signature.document.viewed",
    "signature.document.recipient_signed",
    "signature.document.signed",
    "signature.document.completed",
    "signature.document.finalization_failed",
    "signature.document.voided",
]
"""The 7 events the backend dispatches today (type hint only, not a runtime check)."""


WEBHOOK_EVENTS: Tuple[str, ...] = (
    WEBHOOK_EVENT_SENT,
    WEBHOOK_EVENT_VIEWED,
    WEBHOOK_EVENT_RECIPIENT_SIGNED,
    WEBHOOK_EVENT_SIGNED,
    WEBHOOK_EVENT_COMPLETED,
    WEBHOOK_EVENT_FINALIZATION_FAILED,
    WEBHOOK_EVENT_VOIDED,
)
"""
All 7 TurboSign webhook events, in lifecycle order.

Every signature fires ``recipient_signed`` first, then exactly one of
``completed`` / ``finalization_failed`` (that was the final signature) or
``signed`` (signers still remain).
"""
