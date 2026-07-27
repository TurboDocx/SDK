"""
Client-context detection for audit-trail device/location reporting.

The TurboDocx backend derives the signature audit trail's device + location from
the request's ``User-Agent``, ``X-Timezone``, ``Accept-Language``,
``X-Forwarded-For`` and ``X-Device-Fingerprint`` headers. When the SDK runs in a
container/VM these should describe that environment instead of defaulting to the
HTTP library's generic User-Agent (which the backend records as device
"Unknown") and a loopback/proxy IP (location "Unknown").

The backend only classifies a request as an SDK call when the User-Agent starts
with the canonical ``@turbodocx/sdk/<version>`` token, so every SDK emits that
exact prefix (with a language-specific runtime/OS/host suffix).

Everything here is best-effort and guarded: detection failures degrade to a bare
SDK User-Agent rather than raising.
"""
import hashlib
import os
import platform
import socket
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional


@dataclass
class ClientContext:
    """Caller overrides for the auto-detected client-context headers."""

    #: Override the auto-generated descriptive User-Agent.
    user_agent: Optional[str] = None
    #: Client IP to report as ``X-Forwarded-For`` to drive geolocation. Opt-in:
    #: omitted by default so a container's private IP never overrides the
    #: production load balancer's real public IP (X-Forwarded-For is leftmost-wins).
    ip_address: Optional[str] = None
    #: Override the auto-detected timezone (sent as ``X-Timezone``).
    timezone: Optional[str] = None
    #: Override the auto-detected BCP-47 language tag (sent as ``Accept-Language``).
    language: Optional[str] = None
    #: Override the auto-generated device fingerprint (``X-Device-Fingerprint``).
    device_fingerprint: Optional[str] = None


def get_sdk_version() -> str:
    """Resolve the SDK version; ``"0.0.0"`` if unavailable.

    Prefers the in-code ``__version__`` constant (the lockstep source, analogous
    to Go's ``const Version``) over installed package metadata, which can be a
    stale editable-install value.
    """
    try:
        from .. import __version__

        if __version__:
            return __version__
    except Exception:
        # Best-effort: fall through to package metadata below.
        pass
    try:
        from importlib.metadata import version

        return version("turbodocx-sdk")
    except Exception:
        return "0.0.0"


def build_default_user_agent() -> str:
    """
    Build a descriptive SDK User-Agent from the host environment, e.g.
    ``@turbodocx/sdk/0.4.0 (Python/3.13.5; Linux 5.15.0; x86_64; host=svc-1)``.
    Falls back to ``@turbodocx/sdk/<version>`` if host details are unavailable.
    """
    base = f"@turbodocx/sdk/{get_sdk_version()}"
    try:
        runtime = f"Python/{platform.python_version()}"
        os_name = f"{platform.system()} {platform.release()}".strip()
        return f"{base} ({runtime}; {os_name}; {platform.machine()}; host={socket.gethostname()})"
    except Exception:
        return base


def detect_timezone() -> str:
    """Detect the host timezone name (e.g. "UTC", "EDT"); "" if unavailable."""
    try:
        return datetime.now().astimezone().tzname() or ""
    except Exception:
        return ""


def detect_locale() -> str:
    """Detect the host BCP-47 language tag (e.g. "en-US"); "" if unavailable."""
    try:
        raw = (
            os.environ.get("LC_ALL")
            or os.environ.get("LC_MESSAGES")
            or os.environ.get("LANG")
            or ""
        )
        if not raw:
            try:
                import locale

                raw = locale.getlocale()[0] or ""
            except Exception:
                raw = ""
        # Strip encoding suffix ("en_US.UTF-8" -> "en_US") and normalize.
        tag = raw.split(".")[0].replace("_", "-").strip()
        # Don't surface the non-language C/POSIX locales.
        if tag.upper() in ("C", "POSIX", ""):
            return ""
        return tag
    except Exception:
        return ""


def build_device_fingerprint() -> str:
    """
    Stable, non-reversible fingerprint of the host (hostname/platform/arch).
    Identifies the calling container/VM across requests without exposing raw
    host details. Returns "" if unavailable.
    """
    try:
        seed = "|".join([socket.gethostname(), platform.system(), platform.machine()])
        return hashlib.sha256(seed.encode("utf-8")).hexdigest()
    except Exception:
        return ""


def resolve_client_context_headers(ctx: Optional[ClientContext] = None) -> Dict[str, str]:
    """
    Resolve the effective client-context request headers, applying caller
    overrides over auto-detected host values.
    """
    ctx = ctx or ClientContext()
    headers: Dict[str, str] = {}

    headers["User-Agent"] = ctx.user_agent or build_default_user_agent()

    timezone = ctx.timezone or detect_timezone()
    if timezone:
        headers["X-Timezone"] = timezone

    language = ctx.language or detect_locale()
    if language:
        headers["Accept-Language"] = language

    fingerprint = ctx.device_fingerprint or build_device_fingerprint()
    if fingerprint:
        headers["X-Device-Fingerprint"] = fingerprint

    # Opt-in only (see ClientContext.ip_address).
    if ctx.ip_address:
        headers["X-Forwarded-For"] = ctx.ip_address

    return headers
