"""
Webhook signature verification helper.

Verifies the X-TurboDocx-Signature header on an incoming webhook delivery.
Format matches the backend's webhookService.generateSignature:
  - Header:        X-TurboDocx-Signature: sha256=<hex>
  - Timestamp:     X-TurboDocx-Timestamp: <unix-seconds>
  - String signed: f"{timestamp}.{raw_body}"
  - Algorithm:     HMAC-SHA256

Enforces a configurable timestamp tolerance (default 300s) to prevent
replay attacks. Uses constant-time comparison via hmac.compare_digest.
"""

import hmac
import time as _time
from hashlib import sha256
from typing import Callable, Optional, Union


def verify_webhook_signature(
    raw_body: Union[str, bytes],
    signature_header: str,
    timestamp_header: str,
    secret: str,
    *,
    tolerance_seconds: int = 300,
    now: Optional[Callable[[], int]] = None,
) -> bool:
    """
    Verify a TurboDocx webhook delivery.

    Args:
        raw_body: The raw request body, AS RECEIVED. Do NOT json.loads first;
            do NOT re-serialize. Whitespace must match exactly. Use a framework
            primitive that preserves raw bytes (e.g. Flask's `request.get_data()`
            or FastAPI's `await request.body()`).
        signature_header: Value of the `X-TurboDocx-Signature` header
            (format: "sha256=<hex>").
        timestamp_header: Value of the `X-TurboDocx-Timestamp` header
            (Unix epoch seconds, as string).
        secret: Webhook secret returned by `create_webhook` or
            `regenerate_webhook_secret`.
        tolerance_seconds: Maximum acceptable age of the timestamp, in seconds.
            Defaults to 300 (5 minutes). Set to 0 to disable the timestamp check
            (NOT recommended in production).
        now: Override the "current time" function for deterministic testing.
            Returns Unix epoch seconds. Defaults to `int(time.time())`.

    Returns:
        True iff the signature is valid AND the timestamp is within tolerance.
        Constant-time comparison; never raises on bad input.
    """
    if not signature_header or not timestamp_header or not secret:
        return False

    if tolerance_seconds > 0:
        try:
            ts = int(timestamp_header)
        except (TypeError, ValueError):
            return False
        current_time = now() if now is not None else int(_time.time())
        if abs(current_time - ts) > tolerance_seconds:
            return False

    body_bytes = raw_body.encode("utf-8") if isinstance(raw_body, str) else raw_body
    signed_string = f"{timestamp_header}.".encode("utf-8") + body_bytes

    secret_bytes = secret.encode("utf-8")
    digest = hmac.new(secret_bytes, signed_string, sha256).hexdigest()
    expected = "sha256=" + digest

    # Constant-time string comparison.
    return hmac.compare_digest(expected, signature_header)
