"""
Client-context header tests (parity with JS tests/http-client-context.test.ts).

The audit trail records device/location from request headers. The SDK must send
a descriptive User-Agent starting with "@turbodocx/sdk/" (so the backend parser
classifies it as an SDK call instead of "Unknown"/"API Client"), a timezone, a
language, an optional client IP (X-Forwarded-For -> geolocation), and a device
fingerprint. These tests pin the header contract the backend reads.
"""
from turbodocx_sdk.http import HttpClient
from turbodocx_sdk.utils.client_context import (
    ClientContext,
    resolve_client_context_headers,
)


def make_client(**extra):
    return HttpClient(
        api_key="TDX-test-key",
        org_id="org-test",
        sender_email="support@example.com",
        **extra,
    )


def test_sends_descriptive_turbodocx_sdk_user_agent_by_default():
    ua = make_client()._get_headers()["User-Agent"]
    # e.g. "@turbodocx/sdk/0.4.0 (Python/3.13.5; Linux 5.15; x86_64; host=svc-1)"
    assert ua.startswith("@turbodocx/sdk/")
    # Must NOT be httpx's bare default that yields "Unknown" device info
    assert "httpx" not in ua


def test_lets_caller_override_user_agent():
    h = make_client(client_context=ClientContext(user_agent="my-app/9.9 (worker)"))._get_headers()
    assert h["User-Agent"] == "my-app/9.9 (worker)"


def test_sends_accept_language_from_host_locale_by_default(monkeypatch):
    monkeypatch.setenv("LC_ALL", "")
    monkeypatch.setenv("LC_MESSAGES", "")
    monkeypatch.setenv("LANG", "en_US.UTF-8")
    h = resolve_client_context_headers()
    assert h["Accept-Language"] == "en-US"


def test_lets_caller_override_language():
    h = make_client(client_context=ClientContext(language="fr-FR"))._get_headers()
    assert h["Accept-Language"] == "fr-FR"


def test_lets_caller_override_timezone():
    h = make_client(client_context=ClientContext(timezone="America/New_York"))._get_headers()
    assert h["X-Timezone"] == "America/New_York"


def test_does_not_send_forwarded_for_by_default():
    assert "X-Forwarded-For" not in make_client()._get_headers()


def test_sends_forwarded_for_when_caller_supplies_ip():
    h = make_client(client_context=ClientContext(ip_address="203.0.113.7"))._get_headers()
    assert h["X-Forwarded-For"] == "203.0.113.7"


def test_sends_device_fingerprint_by_default_and_honors_override():
    assert len(make_client()._get_headers().get("X-Device-Fingerprint", "")) > 0
    h = make_client(client_context=ClientContext(device_fingerprint="fp-abc"))._get_headers()
    assert h["X-Device-Fingerprint"] == "fp-abc"


def test_preserves_auth_org_and_content_type():
    h = make_client()._get_headers()
    assert h["Authorization"] == "Bearer TDX-test-key"
    assert h["x-rapiddocx-org-id"] == "org-test"
    assert h["Content-Type"] == "application/json"


def test_multipart_headers_omit_content_type_but_keep_context():
    h = make_client()._get_headers(include_content_type=False)
    assert "Content-Type" not in h
    assert h["User-Agent"].startswith("@turbodocx/sdk/")
