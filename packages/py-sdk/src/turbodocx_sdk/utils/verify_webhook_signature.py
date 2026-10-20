"""
Webhook signature verification helper.

Verifies the X-TurboDocx-Signature header on an incoming webhook delivery.
Format matches how TurboDocx signs each delivery:
  - Header:        X-TurboDocx-Signature: sha256=<hex>
  - Timestamp:     X-TurboDocx-Timestamp: <unix-seconds>
  - String signed: f"{timestamp}.{raw_body}"
  - Algorithm:     HMAC-SHA256

Enforces a configurable timestamp tolerance (default 300s) to prevent
replay attacks. Uses constant-time comparison via hmac.compare_digest.
"""

import hmac
import math
import re
import time as _time
from hashlib import sha256
from typing import Callable, Optional, Union

BytesLike = Union[bytes, bytearray, memoryview]
_TIMESTAMP_RE = re.compile(rb"-?[0-9]+")
StrOrBytes = Union[str, bytes, bytearray, memoryview]


def _as_bytes(value: object) -> bytes:
    """Coerce a str (UTF-8 encoded) or bytes-like value to bytes.

    Raises TypeError for any other type and UnicodeEncodeError (a ValueError) for text that
    can't be UTF-8 encoded, such as a lone surrogate.
    """
    if isinstance(value, str):
        return value.encode("utf-8")
    if isinstance(value, (bytes, bytearray, memoryview)):
        return bytes(value)
    raise TypeError(f"expected str or bytes-like, got {type(value).__name__}")


def _is_real_number(value: object) -> bool:
    """True for a finite int or float (bool excluded). NaN would make every window check pass."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    return math.isfinite(value)


def verify_webhook_signature(
    raw_body: StrOrBytes,
    signature_header: StrOrBytes,
    timestamp_header: StrOrBytes,
    secret: StrOrBytes,
    *,
    tolerance_seconds: int = 300,
    now: Optional[Callable[[], Union[int, float]]] = None,
) -> bool:
    """
    Verify a TurboDocx webhook delivery.

    Args:
        raw_body: The raw request body, AS RECEIVED. Do NOT json.loads first;
            do NOT re-serialize. Whitespace must match exactly. Use a framework
            primitive that preserves raw bytes (e.g. Flask's `request.get_data()`
            or FastAPI's `await request.body()`). str or bytes-like.
        signature_header: Value of the `X-TurboDocx-Signature` header
            (format: "sha256=<hex>"), as str or bytes-like.
        timestamp_header: Value of the `X-TurboDocx-Timestamp` header
            (Unix epoch seconds), as str or bytes-like.
        secret: Webhook secret returned by `create_webhook` or
            `regenerate_webhook_secret`, as str or bytes-like.
        tolerance_seconds: Maximum acceptable age of the timestamp, in seconds.
            Defaults to 300 (5 minutes). Set to 0 to disable the timestamp check
            (NOT recommended in production). A negative, non-numeric or NaN value fails
            closed: every delivery is rejected.
        now: Override the "current time" function for deterministic testing.
            Returns Unix epoch seconds (int or float). Defaults to `int(time.time())`.
            A non-numeric or NaN result fails closed.

    Returns:
        True iff the signature is valid AND the timestamp is within tolerance.
        Constant-time comparison; returns False (never raises) on bad input,
        so a receiver answers 401, not 500.
    """
    # Normalise every input to bytes. Only this step is guarded: a wrong type or unencodable text
    # is bad input and fails closed, while an error in the HMAC step below is a real bug and surfaces.
    try:
        body_bytes = _as_bytes(raw_body)
        provided = _as_bytes(signature_header)
        ts_bytes = _as_bytes(timestamp_header)
        secret_bytes = _as_bytes(secret)
    except (TypeError, UnicodeEncodeError):
        return False

    if not provided or not ts_bytes or not secret_bytes:
        return False

    if not _is_real_number(tolerance_seconds):
        return False

    # A negative window would skip the check below and accept any replayed delivery: fail closed.
    if tolerance_seconds < 0:
        return False

    if tolerance_seconds > 0:
        # Digits only (an optional leading "-"), as in the JS and PHP helpers: int() alone would
        # also accept surrounding whitespace, underscores and a "+".
        if not _TIMESTAMP_RE.fullmatch(ts_bytes):
            return False
        ts = int(ts_bytes)
        current_time = now() if now is not None else int(_time.time())
        if not _is_real_number(current_time):
            return False
        if abs(current_time - ts) > tolerance_seconds:
            return False

    digest = hmac.new(secret_bytes, ts_bytes + b"." + body_bytes, sha256).hexdigest()
    expected = ("sha256=" + digest).encode("ascii")

    # Compare bytes: hmac.compare_digest raises TypeError on non-ASCII str, which would turn a
    # malformed header into a 500 instead of a rejected delivery.
    return hmac.compare_digest(expected, provided)
