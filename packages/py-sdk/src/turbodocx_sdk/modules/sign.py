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
        sender_name: Optional[str] = None
    ) -> None:
        """
        Configure the TurboSign module with API credentials

        Args:
            api_key: TurboDocx API key (required)
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API (optional, defaults to https://api.turbodocx.com)
            org_id: Organization ID (required)
            sender_email: Reply-to email address for signature requests (required).
                         This email will be used as the reply-to address when sending
                         signature request emails. Without it, emails will default to
                         "API Service User via TurboSign".
            sender_name: Sender name for signature requests (optional but strongly recommended).
                        This name will appear in signature request emails. Without this,
                        the sender will appear as "API Service User".

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
            sender_name=sender_name
        )

    @classmethod
    def _get_client(cls) -> HttpClient:
        """Get the HTTP client instance, raising error if not configured"""
        if cls._client is None:
            raise RuntimeError(
                "TurboSign not configured. Call TurboSign.configure(api_key='...', org_id='...') first."
            )
        return cls._client

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
        cc_emails: Optional[List[str]] = None
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

            return await client.upload_file(
                "/turbosign/single/prepare-for-review",
                file=file,
                file_name=file_name or "document.pdf",
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
        cc_emails: Optional[List[str]] = None
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

        Returns:
            Response with success, documentId, and message

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

            return await client.upload_file(
                "/turbosign/single/prepare-for-signing",
                file=file,
                file_name=file_name or "document.pdf",
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
