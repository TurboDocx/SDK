"""
TurboSign Embedded-Signing Tests

Covers the embedded-signing surface ported from the JS SDK:
- create_signing_url        (double-envelope unwrap, XOR selector validation, https guard)
- get_embedded_signing_settings (read-only, envelope unwrap)
- create_embedded_signature (thin wrapper: auth/fields mapping, sendEmail default,
                             ready/pending/completed status mapping by error CODE)

The wrapper tests mock only the HTTP boundary (``_get_client`` -> ``post`` / ``upload_file``)
and let the real ``send_signature`` + ``create_signing_url`` run, so the mapping logic
(auth -> identityVerification, fields shorthand expansion, signingOrder default, sendEmail
suppression) is exercised for real rather than stubbed away.
"""

import json

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from turbodocx_sdk import TurboSign, ValidationError, ConflictError


def _send_envelope(document_id, recipients):
    """What ``client.post``/``upload_file`` returns for prepare-for-signing.

    The HTTP client has already stripped the outer ``{data: ...}`` envelope, so this is the
    inner object.
    """
    return {
        "success": True,
        "documentId": document_id,
        "status": "under_review",
        "recipients": recipients,
        "message": "ok",
    }


def _signing_url_envelope(url, recipient_id, mode="otp"):
    """What ``client.post`` returns for the signing-url endpoint: the ``{results: ...}`` layer
    left after the client strips the outer ``{data: ...}``."""
    return {
        "results": {
            "url": url,
            "expiresAt": None,
            "recipientId": recipient_id,
            "identityVerificationMode": mode,
            "pendingChecks": ["email_otp"] if mode == "otp" else [],
        }
    }


class TestCreateSigningUrl:
    """create_signing_url: envelope unwrap + client-side validation."""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_unwraps_the_double_envelope_to_results(self):
        """Should POST to the signing-url endpoint and return the INNER results object,
        not the ``{results: ...}`` wrapper (the JS SDK once returned the wrong level)."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(
                return_value=_signing_url_envelope("https://app/sign/doc-1?t=X", "rec-1")
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.create_signing_url("doc-1", external_id="cust_1")

            # Unwrapped to the results level -- caller sees `url` directly, not `results`.
            assert result["url"] == "https://app/sign/doc-1?t=X"
            assert result["recipientId"] == "rec-1"
            assert "results" not in result
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert call_args[0][0] == "/turbosign/documents/doc-1/signing-url"
            assert call_args[1]["data"] == {"externalId": "cust_1"}

    @pytest.mark.asyncio
    async def test_passes_identity_assertion_and_return_url_through(self):
        """Should forward identity_assertion and an https return_url verbatim (camelCase body)."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(
                return_value=_signing_url_envelope("https://app/sign/doc-2", "rec-2", "external_idv")
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            assertion = {
                "provider": "CAPA",
                "verificationId": "v-1",
                "verifiedAt": "2026-01-01T00:00:00Z",
                "subjectEmail": "john@example.com",
            }
            result = await TurboSign.create_signing_url(
                "doc-2",
                recipient_id="rec-2",
                identity_assertion=assertion,
                return_url="https://return.example.com/done",
            )

            assert result["identityVerificationMode"] == "external_idv"
            body = mock_client.post.call_args[1]["data"]
            assert body == {
                "recipientId": "rec-2",
                "identityAssertion": assertion,
                "returnUrl": "https://return.example.com/done",
            }

    @pytest.mark.asyncio
    async def test_rejects_zero_selectors_before_any_http_call(self):
        """Should raise ValidationError (code RecipientSelectorInvalid) and not hit the API."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock()
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            with pytest.raises(ValidationError) as exc:
                await TurboSign.create_signing_url("doc-1")

            assert exc.value.code == "RecipientSelectorInvalid"
            mock_client.post.assert_not_called()

    @pytest.mark.asyncio
    async def test_rejects_two_selectors(self):
        """Should raise when BOTH recipient_id and external_id are provided."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock()
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            with pytest.raises(ValidationError) as exc:
                await TurboSign.create_signing_url("doc-1", recipient_id="rec-1", external_id="cust_1")

            assert exc.value.code == "RecipientSelectorInvalid"
            mock_client.post.assert_not_called()

    @pytest.mark.asyncio
    async def test_empty_string_selector_counts_as_absent(self):
        """An empty-string selector is treated as not provided (matches JS): "" + a real id
        is exactly one selector, not two."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(
                return_value=_signing_url_envelope("https://app/sign/doc-1", "rec-1")
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.create_signing_url("doc-1", recipient_id="rec-1", external_id="")

            assert result["recipientId"] == "rec-1"
            assert mock_client.post.call_args[1]["data"] == {"recipientId": "rec-1"}

    @pytest.mark.asyncio
    async def test_flat_body_response_is_returned_as_is(self):
        """If the API ever replies WITHOUT the `{results: ...}` envelope (a flat body), the
        method degrades gracefully and returns the body itself instead of raising KeyError
        (matches the PHP/Go/Java fallback)."""
        flat_body = {
            "url": "https://app/sign/doc-flat?t=X",
            "expiresAt": None,
            "recipientId": "rec-flat",
            "identityVerificationMode": "otp",
            "pendingChecks": ["email_otp"],
        }
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            # No `results` key -- the flat shape.
            mock_client.post = AsyncMock(return_value=flat_body)
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.create_signing_url("doc-flat", external_id="cust_1")

            # Returned verbatim, not a KeyError.
            assert result == flat_body
            assert result["url"] == "https://app/sign/doc-flat?t=X"

    @pytest.mark.asyncio
    async def test_rejects_non_https_return_url(self):
        """Should raise ValidationError (code InvalidReturnUrl) for a non-https return_url."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock()
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            with pytest.raises(ValidationError) as exc:
                await TurboSign.create_signing_url(
                    "doc-1", recipient_id="rec-1", return_url="http://insecure.example.com"
                )

            assert exc.value.code == "InvalidReturnUrl"
            mock_client.post.assert_not_called()


class TestGetEmbeddedSigningSettings:
    """get_embedded_signing_settings: read-only, envelope unwrap."""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_gets_the_settings_endpoint_and_unwraps_results(self):
        """Should GET the settings endpoint and return the inner results object."""
        settings = {
            "enabled": True,
            "allowExternalIdv": False,
            "allowIdentityOverride": True,
            "defaultChannel": "email",
            "allowedFrameAncestors": ["https://app.example.com"],
        }
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value={"results": settings})
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.get_embedded_signing_settings()

            assert result == settings
            mock_client.get.assert_called_once_with("/turbosign/embedded-signing-settings")


class TestCreateEmbeddedSignature:
    """create_embedded_signature: the thin wrapper's mapping + status semantics."""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_maps_email_otp_and_suppresses_emails_by_default(self):
        """auth.email_otp -> identityVerification {otp,email}; signingOrder defaults to 1;
        sendEmail defaults to False on the send payload; one ready result with the embed URL."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            # 1st call: prepare-for-signing (multipart, file present) -> upload_file.
            mock_client.upload_file = AsyncMock(
                return_value=_send_envelope(
                    "doc-1", [{"id": "rec-1", "name": "John", "email": "john@example.com"}]
                )
            )
            # 2nd call: signing-url -> post.
            mock_client.post = AsyncMock(
                return_value=_signing_url_envelope("https://app/sign/doc-1?t=JOHN", "rec-1")
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.create_embedded_signature(
                file=b"%PDF-1.4 fake",
                document_name="Auto Policy",
                recipients=[
                    {
                        "name": "John",
                        "email": "john@example.com",
                        "auth": {"email_otp": True},
                        # All four shorthand keys, incl. the snake_case `full_name` alias.
                        # `initials` must map to the field TYPE `initial` (not `initials`) --
                        # the exact literal the JS source flags as a port hazard.
                        "fields": {
                            "signature": "{signature1}",
                            "date": "{date1}",
                            "initials": "{initials1}",
                            "full_name": "{fullName1}",
                        },
                    }
                ],
            )

            assert result["documentId"] == "doc-1"
            assert len(result["recipients"]) == 1
            r0 = result["recipients"][0]
            assert r0["status"] == "ready"
            assert r0["embedUrl"] == "https://app/sign/doc-1?t=JOHN"
            assert r0["identityVerificationMode"] == "otp"
            assert r0["recipientId"] == "rec-1"

            # The send payload (multipart form) carries the mapped recipient + fields + sendEmail.
            form_data = mock_client.upload_file.call_args[1]["additional_data"]
            sent_recipients = json.loads(form_data["recipients"])
            assert sent_recipients[0]["identityVerification"] == {"mode": "otp", "channel": "email"}
            assert sent_recipients[0]["signingOrder"] == 1
            # sendEmail default is a real boolean False -- invisible unless asserted directly.
            assert form_data["sendEmail"] is False

            # The whole shorthand spec table: type + default size per key, in spec order.
            sent_fields = json.loads(form_data["fields"])
            assert [f["type"] for f in sent_fields] == ["signature", "date", "initial", "full_name"]
            assert sent_fields[0]["template"] == {
                "anchor": "{signature1}",
                "placement": "replace",
                "size": {"width": 100, "height": 30},
            }
            assert sent_fields[1]["template"]["size"] == {"width": 75, "height": 30}   # date
            assert sent_fields[2]["template"]["size"] == {"width": 50, "height": 30}   # initials
            assert sent_fields[3]["template"]["size"] == {"width": 150, "height": 30}  # fullName
            assert sent_fields[3]["template"]["anchor"] == "{fullName1}"

    @pytest.mark.asyncio
    async def test_maps_sms_auth_to_channel_sms_and_sets_phone(self):
        """auth.sms.phone_number -> identityVerification {otp,sms} + recipient phone."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(
                return_value=_send_envelope(
                    "doc-2", [{"id": "rec-9", "name": "Sms", "email": "sms@example.com"}]
                )
            )
            mock_client.post = AsyncMock(
                return_value=_signing_url_envelope("https://app/sign/doc-2", "rec-9", "otp")
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            await TurboSign.create_embedded_signature(
                file=b"%PDF-1.4 fake",
                recipients=[
                    {
                        "name": "Sms",
                        "email": "sms@example.com",
                        "auth": {"sms": {"phone_number": "+13055551234"}},
                    }
                ],
            )

            sent = json.loads(mock_client.upload_file.call_args[1]["additional_data"]["recipients"])
            assert sent[0]["identityVerification"] == {"mode": "otp", "channel": "sms"}
            assert sent[0]["phone"] == "+13055551234"

    @pytest.mark.asyncio
    async def test_returns_results_in_signing_order(self):
        """Two recipients, both minted -> two 'ready' results emitted in signing order."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            # Backend returns recipients in arbitrary order; we match by email.
            mock_client.upload_file = AsyncMock(
                return_value=_send_envelope(
                    "doc-3",
                    [
                        {"id": "rec-b", "name": "Bob", "email": "bob@example.com"},
                        {"id": "rec-a", "name": "Alice", "email": "alice@example.com"},
                    ],
                )
            )
            # create_signing_url is called once per recipient in signing order.
            mock_client.post = AsyncMock(
                side_effect=[
                    _signing_url_envelope("https://app/sign/doc-3?t=ALICE", "rec-a"),
                    _signing_url_envelope("https://app/sign/doc-3?t=BOB", "rec-b"),
                ]
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.create_embedded_signature(
                file=b"%PDF-1.4 fake",
                recipients=[
                    {"name": "Bob", "email": "bob@example.com", "signing_order": 2},
                    {"name": "Alice", "email": "alice@example.com", "signing_order": 1},
                ],
            )

            # Emitted in signing order: Alice (order 1) before Bob (order 2).
            assert [r["name"] for r in result["recipients"]] == ["Alice", "Bob"]
            assert [r["status"] for r in result["recipients"]] == ["ready", "ready"]
            assert result["recipients"][0]["embedUrl"] == "https://app/sign/doc-3?t=ALICE"
            # First signing-url call was for the first-in-order signer (Alice/rec-a).
            assert mock_client.post.call_args_list[0][1]["data"]["recipientId"] == "rec-a"

    @pytest.mark.asyncio
    async def test_not_in_turn_recipient_is_pending_with_null_url(self):
        """A RecipientNotInTurn conflict -> status 'pending', embedUrl None (not an error).
        The ready signer still gets a URL. Mapping is by error CODE, not message text."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(
                return_value=_send_envelope(
                    "doc-4",
                    [
                        {"id": "rec-1", "name": "First", "email": "first@example.com"},
                        {"id": "rec-2", "name": "Second", "email": "second@example.com"},
                    ],
                )
            )
            # First mint succeeds; second is refused because it isn't their turn yet.
            mock_client.post = AsyncMock(
                side_effect=[
                    _signing_url_envelope("https://app/sign/doc-4?t=FIRST", "rec-1"),
                    ConflictError("It is not this recipient's turn to sign yet.", 409, "RecipientNotInTurn"),
                ]
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.create_embedded_signature(
                file=b"%PDF-1.4 fake",
                recipients=[
                    {"name": "First", "email": "first@example.com", "signing_order": 1,
                     "auth": {"email_otp": True}},
                    {"name": "Second", "email": "second@example.com", "signing_order": 2,
                     "auth": {"email_otp": True}},
                ],
            )

            first, second = result["recipients"]
            assert first["status"] == "ready"
            assert first["embedUrl"] == "https://app/sign/doc-4?t=FIRST"
            # Pending: no URL yet, but identity + who they are is still known.
            assert second["status"] == "pending"
            assert second["embedUrl"] is None
            assert second["recipientId"] == "rec-2"
            assert second["identityVerificationMode"] == "otp"

    @pytest.mark.asyncio
    async def test_already_signed_recipient_is_completed_with_null_url(self):
        """A RecipientAlreadySigned conflict -> status 'completed', embedUrl None."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(
                return_value=_send_envelope(
                    "doc-5", [{"id": "rec-1", "name": "Done", "email": "done@example.com"}]
                )
            )
            mock_client.post = AsyncMock(
                side_effect=ConflictError("This recipient has already signed.", 409, "RecipientAlreadySigned")
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.create_embedded_signature(
                file=b"%PDF-1.4 fake",
                recipients=[{"name": "Done", "email": "done@example.com"}],
            )

            assert result["recipients"][0]["status"] == "completed"
            assert result["recipients"][0]["embedUrl"] is None

    @pytest.mark.asyncio
    async def test_rethrows_a_genuine_error_instead_of_masking_it_as_pending(self):
        """A non-turn error (e.g. a real ValidationError) must propagate, not degrade to pending."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(
                return_value=_send_envelope(
                    "doc-6", [{"id": "rec-1", "name": "X", "email": "x@example.com"}]
                )
            )
            mock_client.post = AsyncMock(
                side_effect=ValidationError("Something is genuinely wrong.", 400, "SomethingElse")
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            with pytest.raises(ValidationError) as exc:
                await TurboSign.create_embedded_signature(
                    file=b"%PDF-1.4 fake",
                    recipients=[{"name": "X", "email": "x@example.com"}],
                )

            assert exc.value.code == "SomethingElse"

    @pytest.mark.asyncio
    async def test_raises_when_backend_omits_a_requested_recipient(self):
        """If send_signature doesn't return a recipient for a requested email, we can't mint a
        URL for them -> ValidationError (code EmbeddedRecipientNotReturned)."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            # Backend returns NO recipients.
            mock_client.upload_file = AsyncMock(return_value=_send_envelope("doc-7", []))
            mock_client.post = AsyncMock()
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            with pytest.raises(ValidationError) as exc:
                await TurboSign.create_embedded_signature(
                    file=b"%PDF-1.4 fake",
                    recipients=[{"name": "Ghost", "email": "ghost@example.com"}],
                )

            assert exc.value.code == "EmbeddedRecipientNotReturned"
            mock_client.post.assert_not_called()

    @pytest.mark.asyncio
    async def test_sms_otp_without_phone_raises_before_any_http_call(self):
        """An SMS OTP recipient with no resolved phone must fail fast with
        ValidationError(code PhoneRequiredForSmsOtp) BEFORE any send/mint HTTP call
        (mirrors the JS validateRecipientsIdentity + Go/PHP guards)."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            # These must never be reached -- the guard fires before the send.
            mock_client.upload_file = AsyncMock()
            mock_client.post = AsyncMock()
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            with pytest.raises(ValidationError) as exc:
                await TurboSign.create_embedded_signature(
                    file=b"%PDF-1.4 fake",
                    recipients=[
                        # SMS OTP requested but no phone anywhere (empty sms block).
                        {"name": "NoPhone", "email": "nophone@example.com",
                         "auth": {"sms": {}}},
                    ],
                )

            assert exc.value.code == "PhoneRequiredForSmsOtp"
            # Fail-fast: nothing was sent to the backend.
            mock_client.upload_file.assert_not_called()
            mock_client.post.assert_not_called()

    @pytest.mark.asyncio
    async def test_empty_sms_block_with_top_level_phone_resolves_and_does_not_raise(self):
        """An empty `sms` block requests SMS OTP (presence, not truthiness, matching JS/Go).
        With a top-level `phone` supplied, it resolves to {otp,sms} + that phone and must NOT
        fail-fast -- proving the resolve predicate change is correct, not incidental."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(
                return_value=_send_envelope(
                    "doc-sms", [{"id": "rec-1", "name": "P", "email": "p@example.com"}]
                )
            )
            mock_client.post = AsyncMock(
                return_value=_signing_url_envelope("https://app/sign/doc-sms", "rec-1", "otp")
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            result = await TurboSign.create_embedded_signature(
                file=b"%PDF-1.4 fake",
                recipients=[
                    {
                        "name": "P",
                        "email": "p@example.com",
                        # Empty sms block -> SMS OTP requested; phone comes from the top level.
                        "auth": {"sms": {}},
                        "phone": "+13055551234",
                    }
                ],
            )

            assert result["recipients"][0]["status"] == "ready"
            sent = json.loads(mock_client.upload_file.call_args[1]["additional_data"]["recipients"])
            assert sent[0]["identityVerification"] == {"mode": "otp", "channel": "sms"}
            assert sent[0]["phone"] == "+13055551234"

    @pytest.mark.asyncio
    async def test_full_fields_override_the_shorthand(self):
        """When top-level `fields` is provided it wins verbatim; per-recipient shorthand is
        ignored."""
        with patch.object(TurboSign, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(
                return_value=_send_envelope(
                    "doc-8", [{"id": "rec-1", "name": "A", "email": "a@example.com"}]
                )
            )
            mock_client.post = AsyncMock(
                return_value=_signing_url_envelope("https://app/sign/doc-8", "rec-1", None)
            )
            mock_get_client.return_value = mock_client
            TurboSign.configure(api_key="k", org_id="o", sender_email="s@example.com")

            full_field = {
                "type": "signature",
                "page": 1,
                "x": 10,
                "y": 20,
                "width": 200,
                "height": 50,
                "recipientEmail": "a@example.com",
            }
            await TurboSign.create_embedded_signature(
                file=b"%PDF-1.4 fake",
                fields=[full_field],
                recipients=[
                    {"name": "A", "email": "a@example.com", "fields": {"signature": "{sig}"}}
                ],
            )

            sent_fields = json.loads(mock_client.upload_file.call_args[1]["additional_data"]["fields"])
            assert sent_fields == [full_field]
