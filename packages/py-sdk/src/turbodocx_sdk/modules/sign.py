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
"""

import json
from typing import Any, Dict, List, Optional, Union

import httpx

from ..http import HttpClient, NetworkError
from ..utils.client_context import ClientContext


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
        expiration_warning_interval: Optional[Dict[str, Any]] = None,
        encode_durations: bool = True
    ) -> None:
        """
        Copy per-document reminder/expiration overrides onto an outgoing request body.

        By default durations are JSON-encoded. multipart/form-data has no notion of a nested
        value, so a ``{"value": n, "unit": "days"}`` dict cannot survive the file-upload path as
        an object. The API decodes a JSON-string duration on both content types, so encoding
        uniformly keeps one code path for the TurboSign multipart and JSON branches -- the same
        treatment ``recipients`` and ``fields`` already get.

        A pure-JSON caller with no multipart path (the TurboQuote send endpoints) passes
        ``encode_durations=False`` so durations land on the body as plain ``{"value", "unit"}``
        dicts, which is what those JSON routes expect.

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
                target[key] = json.dumps(duration) if encode_durations else duration

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
                Optional per-field "metadata" drives conditional (IF/THEN) logic:
                  - On a controlling checkbox: {"metadata": {"fieldKey": "request_changes"}}
                  - On a dependent field: {"metadata": {"conditional": {
                      "controllingFieldKey": "request_changes",  # must equal the checkbox's fieldKey
                      "operator": "is_checked" | "is_not_checked",
                      "action": "show" | "unlock"}}}  # show = hidden until met; unlock = read-only until met
                Field dicts are passed through verbatim, so keys stay camelCase.
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
                Optional per-field "metadata" drives conditional (IF/THEN) logic:
                  - On a controlling checkbox: {"metadata": {"fieldKey": "request_changes"}}
                  - On a dependent field: {"metadata": {"conditional": {
                      "controllingFieldKey": "request_changes",  # must equal the checkbox's fieldKey
                      "operator": "is_checked" | "is_not_checked",
                      "action": "show" | "unlock"}}}  # show = hidden until met; unlock = read-only until met
                Field dicts are passed through verbatim, so keys stay camelCase.
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
            Dict with:
                - status: Document status (e.g., 'under_review', 'completed', 'voided', 'expired')
                - expiresAt: ISO timestamp when the signing window closes, present when
                  expiration is enabled; absent (or null) when the document never expires.

        Example:
            >>> status = await TurboSign.get_status("doc-123")
            >>> print(status["status"])  # 'under_review', 'completed', etc.
            >>> print(status.get("expiresAt"))  # deadline, or None when expiration is off
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
