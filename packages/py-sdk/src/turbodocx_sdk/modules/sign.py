"""
TurboSign Module - Digital signature operations

Provides single-step signature operations:
- create_signature_review_link
- send_signature
- get_status
- download
- void_document
- resend_email
- get_audit_trail

Plus the embedded-signing surface (host your own signing UX in an iframe / redirect):
- create_signing_url
- get_embedded_signing_settings
- create_embedded_signature
"""

import json
from typing import Any, Dict, List, Optional, Union

import httpx

from ..http import HttpClient, NetworkError, TurboDocxError, ValidationError
from ..utils.client_context import ClientContext

# Shorthand field key -> the concrete signature field type it emits plus its default size.
# Note ``initials`` maps to the ``initial`` field type -- that is the literal in the field-type
# union (there is no ``initials``).
_EMBEDDED_FIELD_SPECS: Dict[str, Dict[str, Any]] = {
    "signature": {"type": "signature", "size": {"width": 100, "height": 30}},
    "date": {"type": "date", "size": {"width": 75, "height": 30}},
    "initials": {"type": "initial", "size": {"width": 50, "height": 30}},
    "fullName": {"type": "full_name", "size": {"width": 150, "height": 30}},
}

# Error codes the backend uses when a signing URL cannot be minted for turn-order reasons.
# These are expected states in a sequential flow, not failures -- the embedded wrapper degrades
# them to a per-recipient status instead of throwing the whole call away.
_NOT_IN_TURN_CODES = frozenset({"RecipientNotInTurn", "NotSignersTurn"})
_ALREADY_SIGNED_CODE = "RecipientAlreadySigned"


def _resolve_identity_verification(auth: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Map an embedded recipient's ergonomic ``auth`` shorthand to a full identityVerification.

    ``email_otp`` wins when both keys are set. Returns ``None`` when no auth is requested
    (no identity verification). Accepts both snake_case (``email_otp``) and the JS-style
    camelCase (``emailOtp``) key so either spelling works.
    """
    if not auth:
        return None
    if auth.get("email_otp") or auth.get("emailOtp"):
        return {"mode": "otp", "channel": "email"}
    if auth.get("sms"):
        return {"mode": "otp", "channel": "sms"}
    return None


def _expand_recipient_fields(recipient: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Expand a recipient's ``fields`` shorthand into full field dicts.

    One field per provided key, anchored to the given text with ``placement: 'replace'`` and
    the key's default size. Returns an empty list when the recipient has no ``fields``
    shorthand.
    """
    shorthand = recipient.get("fields")
    if not shorthand:
        return []
    fields: List[Dict[str, Any]] = []
    for key, spec in _EMBEDDED_FIELD_SPECS.items():
        # Accept the JS-style camelCase key and its snake_case alias (``fullName`` /
        # ``full_name``), matching the snake_case ergonomics elsewhere in this flow.
        anchor = shorthand.get(key)
        if anchor is None and key == "fullName":
            anchor = shorthand.get("full_name")
        if not anchor:
            continue
        fields.append({
            "type": spec["type"],
            "recipientEmail": recipient["email"],
            "template": {"anchor": anchor, "placement": "replace", "size": spec["size"]},
        })
    return fields


class TurboSign:
    """TurboSign module for digital signature operations"""

    _client: Optional[HttpClient] = None

    @classmethod
    def configure(
        cls,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        base_url: str = "https://api.turbodocx.com",
        org_id: Optional[str] = None,
        sender_email: Optional[str] = None,
        sender_name: Optional[str] = None,
        client_context: Optional[ClientContext] = None
    ) -> None:
        """
        Configure the TurboSign module with API credentials

        Args:
            api_key: TurboDocx API key (required)
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API (optional, defaults to https://api.turbodocx.com)
            org_id: Organization ID (required)
            sender_email: Reply-to email address for signature requests (required).
                         Used as the reply-to address on signature request emails and
                         recorded as the sender in the audit trail. The API rejects sends
                         without it.
            sender_name: Sender name for signature requests (optional). Appears in
                        signature request emails and the audit trail. Defaults to the
                        name of your API key.

        Example:
            >>> TurboSign.configure(
            ...     api_key=os.environ.get("TURBODOCX_API_KEY"),
            ...     org_id=os.environ.get("TURBODOCX_ORG_ID"),
            ...     sender_email="support@yourcompany.com",
            ...     sender_name="Your Company Name"  # Strongly recommended
            ... )
        """
        cls._client = HttpClient(
            api_key=api_key,
            access_token=access_token,
            base_url=base_url,
            org_id=org_id,
            sender_email=sender_email,
            sender_name=sender_name,
            client_context=client_context
        )

    @classmethod
    def _get_client(cls) -> HttpClient:
        """Get the HTTP client instance, raising error if not configured"""
        if cls._client is None:
            raise RuntimeError(
                "TurboSign not configured. Call TurboSign.configure(api_key='...', org_id='...') first."
            )
        return cls._client


    @staticmethod
    def _apply_schedule_overrides(
        target: Dict[str, Any],
        *,
        reminders_enabled: Optional[bool] = None,
        reminder_delay: Optional[Dict[str, Any]] = None,
        reminder_interval: Optional[Dict[str, Any]] = None,
        max_reminders: Optional[int] = None,
        expiration_enabled: Optional[bool] = None,
        expire_after: Optional[Dict[str, Any]] = None,
        expiration_warning: Optional[Dict[str, Any]] = None,
        expiration_warning_interval: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Copy per-document reminder/expiration overrides onto an outgoing request body.

        Durations are JSON-encoded. multipart/form-data has no notion of a nested value, so a
        ``{"value": n, "unit": "days"}`` dict cannot survive the file-upload path as an object.
        The API decodes a JSON-string duration on both content types, so encoding uniformly keeps
        one code path for the multipart and JSON branches -- the same treatment ``recipients`` and
        ``fields`` already get.

        Presence is tested with ``is not None``, never truthiness: ``False`` (feature off) and
        ``0`` (no reminders / never warn) are meaningful values, and a truthiness check would drop
        them and silently fall back to the organization's default.

        Request-body keys stay camelCase -- the API is not snake_case-aware.
        """
        if reminders_enabled is not None:
            target["remindersEnabled"] = reminders_enabled
        if max_reminders is not None:
            target["maxReminders"] = max_reminders
        if expiration_enabled is not None:
            target["expirationEnabled"] = expiration_enabled

        durations = {
            "reminderDelay": reminder_delay,
            "reminderInterval": reminder_interval,
            "expireAfter": expire_after,
            "expirationWarning": expiration_warning,
            "expirationWarningInterval": expiration_warning_interval,
        }
        for key, duration in durations.items():
            if duration is not None:
                target[key] = json.dumps(duration)

    @classmethod
    async def create_signature_review_link(
        cls,
        recipients: List[Dict[str, Any]],
        fields: List[Dict[str, Any]],
        *,
        file: Optional[bytes] = None,
        file_name: Optional[str] = None,
        file_link: Optional[str] = None,
        deliverable_id: Optional[str] = None,
        template_id: Optional[str] = None,
        document_name: Optional[str] = None,
        document_description: Optional[str] = None,
        sender_name: Optional[str] = None,
        sender_email: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        reminders_enabled: Optional[bool] = None,
        reminder_delay: Optional[Dict[str, Any]] = None,
        reminder_interval: Optional[Dict[str, Any]] = None,
        max_reminders: Optional[int] = None,
        expiration_enabled: Optional[bool] = None,
        expire_after: Optional[Dict[str, Any]] = None,
        expiration_warning: Optional[Dict[str, Any]] = None,
        expiration_warning_interval: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create signature review link without sending emails

        This method uploads a document with signature fields and recipients,
        but does NOT send signature request emails. Use this to preview
        field placement before sending.

        Args:
            recipients: List of recipients who will sign
                Each recipient should have: name, email, signingOrder
            fields: Signature fields configuration
                Each field should have: type, recipientEmail, and positioning info
            file: PDF file content as bytes
            file_name: Original filename
            file_link: URL to document file
            deliverable_id: TurboDocx deliverable ID
            template_id: TurboDocx template ID
            document_name: Document name
            document_description: Document description
            sender_name: Sender name
            sender_email: Sender email
            cc_emails: List of CC email addresses

        Returns:
            Response with documentId, status, previewUrl, and recipients

        Example:
            >>> result = await TurboSign.create_signature_review_link(
            ...     file=pdf_bytes,
            ...     recipients=[{"name": "John Doe", "email": "john@example.com", "signingOrder": 1}],
            ...     fields=[{"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientEmail": "john@example.com"}]
            ... )
        """
        client = cls._get_client()

        # Get sender config from client
        sender_config = client.get_sender_config()

        # Handle different file input methods
        if file:
            # For file upload, use form data with JSON strings
            form_data: Dict[str, Any] = {
                "recipients": json.dumps(recipients),
                "fields": json.dumps(fields),
            }

            # Add optional fields
            if document_name:
                form_data["documentName"] = document_name
            if document_description:
                form_data["documentDescription"] = document_description

            # Use request senderEmail/senderName if provided, otherwise fall back to configured values
            form_data["senderEmail"] = sender_email or sender_config["sender_email"]
            if sender_name or sender_config["sender_name"]:
                form_data["senderName"] = sender_name or sender_config["sender_name"]

            if cc_emails:
                form_data["ccEmails"] = json.dumps(cc_emails)
            TurboSign._apply_schedule_overrides(
                form_data,
                reminders_enabled=reminders_enabled,
                reminder_delay=reminder_delay,
                reminder_interval=reminder_interval,
                max_reminders=max_reminders,
                expiration_enabled=expiration_enabled,
                expire_after=expire_after,
                expiration_warning=expiration_warning,
                expiration_warning_interval=expiration_warning_interval,
            )

            return await client.upload_file(
                "/turbosign/single/prepare-for-review",
                file=file,
                file_name=file_name or None,
                additional_data=form_data
            )
        else:
            # For JSON body (template_id, file_link, deliverable_id)
            # Backend expects recipients/fields as JSON strings (same as form-data)
            json_body: Dict[str, Any] = {
                "recipients": json.dumps(recipients),
                "fields": json.dumps(fields),
            }

            # Add optional fields
            if document_name:
                json_body["documentName"] = document_name
            if document_description:
                json_body["documentDescription"] = document_description

            # Use request senderEmail/senderName if provided, otherwise fall back to configured values
            json_body["senderEmail"] = sender_email or sender_config["sender_email"]
            if sender_name or sender_config["sender_name"]:
                json_body["senderName"] = sender_name or sender_config["sender_name"]

            if cc_emails:
                json_body["ccEmails"] = json.dumps(cc_emails)
            TurboSign._apply_schedule_overrides(
                json_body,
                reminders_enabled=reminders_enabled,
                reminder_delay=reminder_delay,
                reminder_interval=reminder_interval,
                max_reminders=max_reminders,
                expiration_enabled=expiration_enabled,
                expire_after=expire_after,
                expiration_warning=expiration_warning,
                expiration_warning_interval=expiration_warning_interval,
            )

            # URL, deliverable, or template
            if file_link:
                json_body["fileLink"] = file_link
            if deliverable_id:
                json_body["deliverableId"] = deliverable_id
            if template_id:
                json_body["templateId"] = template_id

            return await client.post(
                "/turbosign/single/prepare-for-review",
                data=json_body
            )

    @classmethod
    async def send_signature(
        cls,
        recipients: List[Dict[str, Any]],
        fields: List[Dict[str, Any]],
        *,
        file: Optional[bytes] = None,
        file_name: Optional[str] = None,
        file_link: Optional[str] = None,
        deliverable_id: Optional[str] = None,
        template_id: Optional[str] = None,
        document_name: Optional[str] = None,
        document_description: Optional[str] = None,
        sender_name: Optional[str] = None,
        sender_email: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        send_email: Optional[bool] = None,
        reminders_enabled: Optional[bool] = None,
        reminder_delay: Optional[Dict[str, Any]] = None,
        reminder_interval: Optional[Dict[str, Any]] = None,
        max_reminders: Optional[int] = None,
        expiration_enabled: Optional[bool] = None,
        expire_after: Optional[Dict[str, Any]] = None,
        expiration_warning: Optional[Dict[str, Any]] = None,
        expiration_warning_interval: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send signature request and immediately send emails

        This method uploads a document with signature fields and recipients,
        then immediately sends signature request emails to all recipients.

        Args:
            recipients: List of recipients who will sign
                Each recipient should have: name, email, signingOrder
            fields: Signature fields configuration
                Each field should have: type, recipientEmail, and positioning info
            file: PDF file content as bytes
            file_name: Original filename
            file_link: URL to document file
            deliverable_id: TurboDocx deliverable ID
            template_id: TurboDocx template ID
            document_name: Document name
            document_description: Document description
            sender_name: Sender name
            sender_email: Sender email
            cc_emails: List of CC email addresses
            send_email: Whether the backend should email recipients. Omit (None) to keep the
                default behaviour. Set False to suppress recipient emails -- used by the
                embedded-signing flow, where the host owns the signing UX. Tested with
                ``is not None`` so an explicit False is honoured (a truthiness check would
                silently drop it and let the backend email everyone).

        Returns:
            Response with success, documentId, status, recipients, and message

        Example:
            >>> result = await TurboSign.send_signature(
            ...     file=pdf_bytes,
            ...     recipients=[{"name": "John Doe", "email": "john@example.com", "signingOrder": 1}],
            ...     fields=[{"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientEmail": "john@example.com"}]
            ... )
        """
        client = cls._get_client()

        # Get sender config from client
        sender_config = client.get_sender_config()

        # Handle different file input methods
        if file:
            # For file upload, use form data with JSON strings
            form_data: Dict[str, Any] = {
                "recipients": json.dumps(recipients),
                "fields": json.dumps(fields),
            }

            # Add optional fields
            if document_name:
                form_data["documentName"] = document_name
            if document_description:
                form_data["documentDescription"] = document_description

            # Use request senderEmail/senderName if provided, otherwise fall back to configured values
            form_data["senderEmail"] = sender_email or sender_config["sender_email"]
            if sender_name or sender_config["sender_name"]:
                form_data["senderName"] = sender_name or sender_config["sender_name"]

            if cc_emails:
                form_data["ccEmails"] = json.dumps(cc_emails)
            # Forward email suppression only when explicitly set. Presence is tested with
            # ``is not None`` (never truthiness): False (do not email) is the meaningful value
            # the embedded flow relies on, and a truthiness check would drop it.
            if send_email is not None:
                form_data["sendEmail"] = send_email
            TurboSign._apply_schedule_overrides(
                form_data,
                reminders_enabled=reminders_enabled,
                reminder_delay=reminder_delay,
                reminder_interval=reminder_interval,
                max_reminders=max_reminders,
                expiration_enabled=expiration_enabled,
                expire_after=expire_after,
                expiration_warning=expiration_warning,
                expiration_warning_interval=expiration_warning_interval,
            )

            return await client.upload_file(
                "/turbosign/single/prepare-for-signing",
                file=file,
                file_name=file_name or None,
                additional_data=form_data
            )
        else:
            # For JSON body (template_id, file_link, deliverable_id)
            # Backend expects recipients/fields as JSON strings (same as form-data)
            json_body: Dict[str, Any] = {
                "recipients": json.dumps(recipients),
                "fields": json.dumps(fields),
            }

            # Add optional fields
            if document_name:
                json_body["documentName"] = document_name
            if document_description:
                json_body["documentDescription"] = document_description

            # Use request senderEmail/senderName if provided, otherwise fall back to configured values
            json_body["senderEmail"] = sender_email or sender_config["sender_email"]
            if sender_name or sender_config["sender_name"]:
                json_body["senderName"] = sender_name or sender_config["sender_name"]

            if cc_emails:
                json_body["ccEmails"] = json.dumps(cc_emails)
            # Forward email suppression only when explicitly set (``is not None``, never
            # truthiness) -- the embedded flow's False must survive.
            if send_email is not None:
                json_body["sendEmail"] = send_email
            TurboSign._apply_schedule_overrides(
                json_body,
                reminders_enabled=reminders_enabled,
                reminder_delay=reminder_delay,
                reminder_interval=reminder_interval,
                max_reminders=max_reminders,
                expiration_enabled=expiration_enabled,
                expire_after=expire_after,
                expiration_warning=expiration_warning,
                expiration_warning_interval=expiration_warning_interval,
            )

            # URL, deliverable, or template
            if file_link:
                json_body["fileLink"] = file_link
            if deliverable_id:
                json_body["deliverableId"] = deliverable_id
            if template_id:
                json_body["templateId"] = template_id

            return await client.post(
                "/turbosign/single/prepare-for-signing",
                data=json_body
            )

    @classmethod
    async def get_status(cls, document_id: str) -> Dict[str, Any]:
        """
        Get the status of a document

        Args:
            document_id: ID of the document

        Returns:
            Dict with status field:
                - status: Document status (e.g., 'under_review', 'completed', 'voided')

        Example:
            >>> status = await TurboSign.get_status("doc-123")
            >>> print(status["status"])  # 'under_review', 'completed', etc.
        """
        client = cls._get_client()
        return await client.get(f"/turbosign/documents/{document_id}/status")

    @classmethod
    async def get_recipients(cls, document_id: str) -> Dict[str, Any]:
        """
        Get every recipient on a document with their signing status

        Answers "who has signed and who are we still waiting on" in one call, and
        reports who sent the document.

        Args:
            document_id: ID of the document

        Returns:
            Dict with:
                - document: id, name, status, createdOn, sentOn (null while a draft),
                  expiresAt, and sentBy {name, email} — who sent it
                - recipients: list of {id, name, email, status, effectiveStatus, signedOn,
                  signingOrder, delivery}
                - summary: {total, pending, viewed, completed, voided, expired, waitingOn}

            `status` is the raw database value and is only ever 'pending', 'viewed' or
            'completed'. `effectiveStatus` layers the document's terminal state on top and
            is what you should display: a signer on a voided or expired document reads
            'voided'/'expired' there while `status` still says 'pending'. A completed
            signature is never revoked.

            `delivery` is that recipient's email history:
            {firstSentOn, lastSentOn, totalSent, reminderCount, lastRemindedAt,
            warningCount, lastWarningAt}. CC notifications are excluded — a CC address
            is not a signer.

            Two `delivery` fields are easy to misread:

            - `reminderCount` counts AUTOMATIC (scheduled) reminders only — it is the
              counter `maxReminders` caps. A manual "remind now" does not increment it
              (it must not consume the cap budget), though it does land in `totalSent`.
              So it can read 0 while reminder emails have genuinely been sent.
            - `lastRemindedAt` is when the reminder CADENCE CLOCK was last reset, not
              necessarily when a reminder was sent. The initial signature-request send,
              each scheduled reminder, each manual "remind now" and each expiry warning
              all stamp it. A freshly-sent document therefore normally reads a non-null
              `lastRemindedAt` alongside `reminderCount` of 0.

            `warningCount` / `lastWarningAt` are touched only by an expiry warning.

        Example:
            >>> result = await TurboSign.get_recipients("doc-123")
            >>> print(f"{result['summary']['completed']}/{result['summary']['total']} signed")
            >>> print(f"still waiting on {result['summary']['waitingOn']}")
            >>> for r in result["recipients"]:
            ...     print(r["name"], r["effectiveStatus"], r["delivery"]["totalSent"])
        """
        client = cls._get_client()
        return await client.get(f"/turbosign/documents/{document_id}/recipients")

    @classmethod
    async def download(cls, document_id: str) -> bytes:
        """
        Download the signed document

        The backend returns a presigned S3 URL. This method fetches
        that URL and then downloads the actual file from S3.

        Args:
            document_id: ID of the document

        Returns:
            PDF file content as bytes

        Example:
            >>> pdf_content = await TurboSign.download("doc-123")
            >>> with open("signed.pdf", "wb") as f:
            ...     f.write(pdf_content)
        """
        client = cls._get_client()

        # Get presigned URL from API
        response = await client.get(f"/turbosign/documents/{document_id}/download")

        # Response contains downloadUrl
        download_url = response.get("downloadUrl")
        if not download_url:
            raise ValueError("No download URL in response")

        # Fetch actual file from S3
        async with httpx.AsyncClient() as http_client:
            try:
                file_response = await http_client.get(download_url)
                if not file_response.is_success:
                    raise NetworkError(f"Failed to download file: {file_response.status_code}")
                return file_response.content
            except (httpx.NetworkError, httpx.TimeoutException) as e:
                raise NetworkError(f"Failed to download file: {e}")

    @classmethod
    async def void_document(cls, document_id: str, reason: str) -> Dict[str, Any]:
        """
        Void a document (cancel signature request)

        Args:
            document_id: ID of the document to void
            reason: Reason for voiding the document

        Returns:
            Dict with:
                - id: Document ID (str)
                - name: Document name (str)
                - status: Document status, should be 'voided' (str)
                - voidReason: Reason for voiding (str, optional)
                - voidedAt: ISO timestamp when voided (str, optional)

        Example:
            >>> result = await TurboSign.void_document("doc-123", "Document needs revision")
            >>> print(result["status"])  # "voided"
            >>> print(result["voidedAt"])  # "2025-01-26T12:00:00.000Z"
        """
        client = cls._get_client()
        return await client.post(
            f"/turbosign/documents/{document_id}/void",
            data={"reason": reason}
        )

    @classmethod
    async def send_reminder(
        cls,
        document_id: str,
        recipient_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Send a reminder email to a document's outstanding signers

        This is a standalone nudge, deliberately decoupled from the automatic reminder schedule:
        it ignores the configured cadence, works even when reminders are disabled or the
        per-signer cap is already spent, and does not consume that cap.

        Only signers at the CURRENT signing order are emailed. A recipient at a later order (or
        one who has already signed) is reported back as skipped rather than silently dropped, so
        the caller can tell that nobody was emailed.

        Args:
            document_id: ID of the document
            recipient_ids: Optional subset to remind. Omit to remind every eligible signer.
                When supplied, the request is all-or-nothing: if any id is not a current-order
                pending signer the API rejects the whole call and sends nothing.

        Returns:
            Dict with:
                - results: One entry per recipient considered, each with recipientId, status
                  (e.g. "sent", "skipped_wrong_order"), and optionally reminderCount and phase

        Example:
            >>> result = await TurboSign.send_reminder("doc-123")
            >>> for entry in result["results"]:
            ...     print(entry["recipientId"], entry["status"])
            >>> # Nudge one specific signer
            >>> await TurboSign.send_reminder("doc-123", ["rec-1"])
        """
        client = cls._get_client()

        # Only include the filter when it actually names someone. The API requires at least one
        # id when the key is present, so forwarding an empty list would guarantee a 400 -- an
        # empty list is far more likely to mean "no filter" than "remind nobody".
        body: Dict[str, Any] = {}
        if recipient_ids:
            body["recipientIds"] = recipient_ids

        return await client.post(
            f"/turbosign/documents/{document_id}/send-reminder",
            data=body
        )

    @classmethod
    async def resend_email(
        cls,
        document_id: str,
        recipient_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Resend signature request email to recipients

        Args:
            document_id: ID of the document
            recipient_ids: List of recipient IDs to resend emails to

        Returns:
            Dict with:
                - success: Whether the resend was successful (bool)
                - recipientCount: Number of recipients who received email (int)

        Example:
            >>> result = await TurboSign.resend_email("doc-123", ["rec-1", "rec-2"])
            >>> print(result["recipientCount"])  # 2
        """
        client = cls._get_client()
        return await client.post(
            f"/turbosign/documents/{document_id}/resend-email",
            data={"recipientIds": recipient_ids}
        )

    @classmethod
    async def get_audit_trail(cls, document_id: str) -> Dict[str, Any]:
        """
        Get audit trail for a document

        Args:
            document_id: ID of the document

        Returns:
            Dict with:
                - document: Dict with id and name
                - auditTrail: List of audit entries, each with:
                    - id, documentId, actionType, timestamp
                    - previousHash, currentHash, createdOn
                    - details (optional), user (optional), recipient (optional)

        Example:
            >>> audit = await TurboSign.get_audit_trail("doc-123")
            >>> print(audit["document"]["name"])
            >>> for entry in audit["auditTrail"]:
            ...     print(f"{entry['actionType']} - {entry['timestamp']}")
        """
        client = cls._get_client()
        return await client.get(f"/turbosign/documents/{document_id}/audit-trail")

    # ============================================
    # EMBEDDED SIGNING
    # ============================================

    @classmethod
    async def create_signing_url(
        cls,
        document_id: str,
        *,
        recipient_id: Optional[str] = None,
        external_id: Optional[str] = None,
        identity_assertion: Optional[Dict[str, Any]] = None,
        return_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Mint a single-use embedded signing URL for one recipient.

        Request it the moment the signer is ready (never store it). Open the returned ``url``
        in a new tab, redirect to it, or embed it in an iframe. This is the counterpart of
        DocuSign's createRecipientView / BoldSign's GetEmbeddedSignLink.

        Args:
            document_id: The document the recipient belongs to.
            recipient_id: Select the recipient by their TurboDocx recipient id.
            external_id: ...or by the externalId you set when creating the recipient.
                Provide EXACTLY ONE of recipient_id / external_id.
            identity_assertion: An assertion from your own identity provider, required only
                when the recipient's mode is ``external_idv``. A dict with camelCase keys:
                ``provider``, ``verificationId``, ``verifiedAt`` (ISO 8601), ``subjectEmail``.
            return_url: Where TurboSign returns the signer after completion. Must be https.

        Returns:
            Dict with the signing URL and its metadata (camelCase, straight from the API):
                - url: The URL to open / redirect to / embed for the signer.
                - expiresAt: When the URL stops working (ISO 8601), or None for
                  otp/no-verification recipients (whose link follows the document's own
                  signing window instead of a short single-use expiry).
                - recipientId: The resolved recipient id.
                - externalId: The recipient's externalId (when set).
                - identityVerificationMode: 'otp' | 'external_idv' | 'override' | None.
                - pendingChecks: Passcode steps the signer must clear
                  (e.g. ['email_otp']). Non-empty only for 'otp'.

        Raises:
            ValidationError: If not exactly one selector is given, or return_url is not https.

        Example:
            >>> link = await TurboSign.create_signing_url("doc-123", external_id="cust_42")
            >>> print(link["url"], link["pendingChecks"])
            >>> # external_idv recipient -- pass the assertion from your own provider:
            >>> link = await TurboSign.create_signing_url(
            ...     "doc-123",
            ...     recipient_id="rec-1",
            ...     identity_assertion={
            ...         "provider": "CAPA",
            ...         "verificationId": "v-1",
            ...         "verifiedAt": "2026-01-01T00:00:00Z",
            ...         "subjectEmail": "john@example.com",
            ...     },
            ... )
        """
        # Fail fast with actionable messages; the server still enforces everything. An empty
        # string counts as absent, matching the JS SDK.
        selectors = [v for v in (recipient_id, external_id) if v is not None and v != ""]
        if len(selectors) != 1:
            raise ValidationError(
                "Provide exactly one of recipient_id or external_id to create_signing_url.",
                code="RecipientSelectorInvalid",
            )
        if return_url and not return_url.lower().startswith("https://"):
            raise ValidationError("return_url must be an https URL.", code="InvalidReturnUrl")

        body: Dict[str, Any] = {}
        if recipient_id:
            body["recipientId"] = recipient_id
        if external_id:
            body["externalId"] = external_id
        if identity_assertion is not None:
            body["identityAssertion"] = identity_assertion
        if return_url:
            body["returnUrl"] = return_url

        client = cls._get_client()
        # The endpoint replies { data: { results } }. The HTTP client strips the outer `data`,
        # so unwrap the `results` envelope here (same convention as the quote/deliverable
        # modules). Returning the un-unwrapped dict would hand callers the wrong level.
        response = await client.post(
            f"/turbosign/documents/{document_id}/signing-url",
            data=body,
        )
        return response["results"]

    @classmethod
    async def get_embedded_signing_settings(cls) -> Dict[str, Any]:
        """
        Read the org's embedded-signing settings (read-only).

        These are the set-once, org-wide gates plus the default OTP channel and the allowed
        iframe embedding origins. Use it to see what is permitted before you request signing
        URLs. The per-recipient identity mode is chosen when you create each recipient, not
        here.

        Returns:
            Dict with the org gates (camelCase, straight from the API):
                - enabled: Embedded signing (and OTP identity verification) is on for the org.
                - allowExternalIdv: You may assert a signer's identity with your own provider.
                - allowIdentityOverride: A sender may issue a link that skips identity
                  verification (override; development/testing).
                - defaultChannel: 'none' | 'email' | 'sms' -- default OTP channel on the
                  interactive (UI) create path only; does not affect SDK/API sends.
                - allowedFrameAncestors: Origins allowed to embed the signing page in an
                  iframe (empty list = no restriction configured).

        Example:
            >>> settings = await TurboSign.get_embedded_signing_settings()
            >>> if not settings["enabled"]:
            ...     raise RuntimeError("Embedded signing is not enabled for this org.")
        """
        client = cls._get_client()
        # { data: { results } } envelope, same as create_signing_url above.
        response = await client.get("/turbosign/embedded-signing-settings")
        return response["results"]

    @classmethod
    async def create_embedded_signature(
        cls,
        recipients: List[Dict[str, Any]],
        *,
        file: Optional[bytes] = None,
        file_name: Optional[str] = None,
        file_link: Optional[str] = None,
        template_id: Optional[str] = None,
        deliverable_id: Optional[str] = None,
        document_name: Optional[str] = None,
        document_description: Optional[str] = None,
        sender_name: Optional[str] = None,
        sender_email: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        fields: Optional[List[Dict[str, Any]]] = None,
        send_email: Optional[bool] = None,
        return_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a signature request AND mint a per-recipient embedded signing URL in ONE call.

        The embedded-signing counterpart of DocuSeal's create-with-embed and Dropbox Sign's
        embedded flow. This is a thin WRAPPER over :meth:`send_signature` +
        :meth:`create_signing_url` -- no new endpoint. It maps the ergonomic request
        (per-recipient ``auth`` + ``fields`` shorthand) onto those calls, then assembles a
        per-recipient result carrying the embed URL and the resolved identity mode.

        Mapping:
            - ``auth.email_otp`` -> identityVerification {mode:'otp', channel:'email'};
              ``auth.sms.phone_number`` -> {mode:'otp', channel:'sms'} and sets the
              recipient's ``phone`` (accepts camelCase ``phoneNumber`` too).
            - ``fields`` shorthand -> full field dicts (placement:'replace' + default size).
              Provide the top-level ``fields`` to override the shorthand with full control.
            - ``signing_order`` defaults to each recipient's index + 1.
            - ``send_email`` defaults to False (you own the UX; forwarded to the backend).
            - ``return_url`` is passed through to each embed URL only when provided (https).

        Turn-aware: with a real (sequential) signing order the backend only mints a URL for
        the signer whose turn it is. Rather than throw the whole call away, each result
        carries a ``status``:
            - 'ready'     -- it's their turn; ``embedUrl`` is set, frame it now.
            - 'pending'   -- an earlier signer hasn't finished; ``embedUrl`` is None.
              Re-mint with :meth:`create_signing_url` once earlier signers complete.
            - 'completed' -- they've already signed; ``embedUrl`` is None.
        A genuine error (anything other than not-in-turn / already-signed) still propagates.

        Args:
            recipients: List of signer dicts. Each: ``name``, ``email``, optional ``phone``,
                optional ``signing_order`` (or ``signingOrder``), optional ``auth``
                ({"email_otp": True} or {"sms": {"phone_number": "+1..."}}), optional
                ``fields`` shorthand ({"signature": "{signature1}", "date": "{date1}", ...}).
            file: PDF file content as bytes.
            file_name: Original filename.
            file_link: URL to the document file.
            template_id: TurboDocx template id.
            deliverable_id: TurboDocx deliverable id.
            document_name: Document name.
            document_description: Document description.
            sender_name: Sender name.
            sender_email: Sender email.
            cc_emails: List of CC email addresses.
            fields: Optional full field control; overrides the per-recipient ``fields``
                shorthand when provided.
            send_email: Whether the backend emails recipients. Defaults to False for this
                embedded flow (the host owns the UX).
            return_url: Optional https completion fallback, passed to each embed URL.

        Returns:
            Dict with:
                - documentId: The created document's id.
                - recipients: One entry per signer IN SIGNING ORDER, each with recipientId,
                  name, email, embedUrl (str or None), status
                  ('ready'|'pending'|'completed'), and identityVerificationMode.

        Example:
            >>> result = await TurboSign.create_embedded_signature(
            ...     file=pdf_bytes,
            ...     document_name="Auto Policy",
            ...     recipients=[
            ...         {"name": "John Doe", "email": "john@example.com",
            ...          "auth": {"email_otp": True},
            ...          "fields": {"signature": "{signature1}", "date": "{date1}"}},
            ...     ],
            ... )
            >>> # Open result["recipients"][0]["embedUrl"] in an iframe / new tab.
        """
        # 1. Map the ergonomic recipients onto full recipient dicts (identity + phone + order).
        mapped_recipients: List[Dict[str, Any]] = []
        for index, r in enumerate(recipients):
            auth = r.get("auth")
            identity_verification = _resolve_identity_verification(auth)
            sms = (auth or {}).get("sms") or {}
            phone = sms.get("phone_number") or sms.get("phoneNumber") or r.get("phone")
            recipient: Dict[str, Any] = {
                "name": r["name"],
                "email": r["email"],
                "signingOrder": r.get("signing_order", r.get("signingOrder", index + 1)),
            }
            if phone:
                recipient["phone"] = phone
            if identity_verification:
                recipient["identityVerification"] = identity_verification
            mapped_recipients.append(recipient)

        # Full `fields` (when provided) win verbatim; otherwise expand each shorthand.
        expanded_fields: List[Dict[str, Any]] = fields if fields is not None else [
            field for r in recipients for field in _expand_recipient_fields(r)
        ]

        sent = await cls.send_signature(
            mapped_recipients,
            expanded_fields,
            file=file,
            file_name=file_name,
            file_link=file_link,
            template_id=template_id,
            deliverable_id=deliverable_id,
            document_name=document_name,
            document_description=document_description,
            sender_name=sender_name,
            sender_email=sender_email,
            cc_emails=cc_emails,
            # Embedded flow default: suppress recipient emails (the host owns the UX).
            send_email=send_email if send_email is not None else False,
        )

        # Match the backend's recipients back to the request by email so we can carry `name`
        # and know the resolved identity mode. The response's `recipients` is optional.
        sent_recipients = sent.get("recipients") or []
        recipient_id_by_email = {
            sr["email"]: sr["id"] for sr in sent_recipients if sr.get("email") and sr.get("id")
        }
        document_id = sent["documentId"]

        # 2 + 3. Mint one embed URL per recipient and assemble the result IN SIGNING ORDER.
        ordered = sorted(
            (
                (r, r.get("signing_order", r.get("signingOrder", index + 1)))
                for index, r in enumerate(recipients)
            ),
            key=lambda pair: pair[1],
        )

        results: List[Dict[str, Any]] = []
        for r, _order in ordered:
            recipient_id = recipient_id_by_email.get(r["email"])
            if not recipient_id:
                raise ValidationError(
                    f'send_signature did not return a recipient matching "{r["email"]}"; '
                    "cannot mint an embed URL.",
                    code="EmbeddedRecipientNotReturned",
                )
            # Turn-aware: the backend refuses to mint a URL for a signer whose turn hasn't come
            # (`RecipientNotInTurn`/`NotSignersTurn`) or who already signed
            # (`RecipientAlreadySigned`). Those are expected states, not failures -- degrade to
            # a null URL + status so the caller can mint the URL later. Any OTHER error
            # propagates. We branch on the error CODE, never the message text.
            try:
                link = await cls.create_signing_url(
                    document_id,
                    recipient_id=recipient_id,
                    return_url=return_url,
                )
                results.append({
                    "recipientId": recipient_id,
                    "name": r["name"],
                    "email": r["email"],
                    "embedUrl": link["url"],
                    "status": "ready",
                    "identityVerificationMode": link.get("identityVerificationMode"),
                })
            except TurboDocxError as err:
                code = err.code
                if code not in _NOT_IN_TURN_CODES and code != _ALREADY_SIGNED_CODE:
                    raise
                iv = _resolve_identity_verification(r.get("auth"))
                results.append({
                    "recipientId": recipient_id,
                    "name": r["name"],
                    "email": r["email"],
                    "embedUrl": None,
                    "status": "completed" if code == _ALREADY_SIGNED_CODE else "pending",
                    "identityVerificationMode": iv["mode"] if iv else None,
                })

        return {"documentId": document_id, "recipients": results}
