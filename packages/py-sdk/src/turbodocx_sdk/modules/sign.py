"""
TurboSign Module - Digital signature operations

Provides 100% parity with n8n-nodes-turbodocx operations:
- prepare_for_review
- prepare_for_signing_single
- get_status
- download
- void_document
- resend_email
"""

import json
from typing import Any, Dict, List, Optional, Union

from ..http import HttpClient


class TurboSign:
    """TurboSign module for digital signature operations"""

    _client: Optional[HttpClient] = None

    @classmethod
    def configure(
        cls,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        base_url: str = "https://api.turbodocx.com"
    ) -> None:
        """
        Configure the TurboSign module with API credentials

        Args:
            api_key: TurboDocx API key
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API (default: https://api.turbodocx.com)
        """
        cls._client = HttpClient(
            api_key=api_key,
            access_token=access_token,
            base_url=base_url
        )

    @classmethod
    def _get_client(cls) -> HttpClient:
        """Get the HTTP client instance, raising error if not configured"""
        if cls._client is None:
            raise RuntimeError(
                "TurboSign not configured. Call TurboSign.configure(api_key='...') first."
            )
        return cls._client

    # ============================================
    # N8N PARITY METHODS (single-call operations)
    # ============================================

    @classmethod
    async def prepare_for_review(
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
        Prepare document for review without sending emails

        This method uploads a document with signature fields and recipients,
        but does NOT send signature request emails. Use this to preview
        field placement before sending.

        Args:
            recipients: List of recipients who will sign
            fields: Signature fields configuration
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
            Document ready for review with preview URL

        Example:
            >>> result = await TurboSign.prepare_for_review(
            ...     file=pdf_bytes,
            ...     recipients=[{"name": "John Doe", "email": "john@example.com", "order": 1}],
            ...     fields=[{"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 1}]
            ... )
        """
        client = cls._get_client()

        # Serialize recipients and fields to JSON strings (as n8n node does)
        form_data: Dict[str, Any] = {
            "recipients": json.dumps(recipients),
            "fields": json.dumps(fields),
        }

        # Add optional fields
        if document_name:
            form_data["documentName"] = document_name
        if document_description:
            form_data["documentDescription"] = document_description
        if sender_name:
            form_data["senderName"] = sender_name
        if sender_email:
            form_data["senderEmail"] = sender_email
        if cc_emails:
            form_data["ccEmails"] = ",".join(cc_emails)

        # Handle different file input methods
        if file:
            response = await client.upload_file(
                "/turbosign/single/prepare-for-review",
                file=file,
                file_name=file_name or "document.pdf",
                additional_data=form_data
            )
        else:
            # URL, deliverable, or template
            if file_link:
                form_data["fileLink"] = file_link
            if deliverable_id:
                form_data["deliverableId"] = deliverable_id
            if template_id:
                form_data["templateId"] = template_id

            response = await client.post(
                "/turbosign/single/prepare-for-review",
                data=form_data
            )

        return response.get("data", response)

    @classmethod
    async def prepare_for_signing_single(
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
        Prepare document for signing and send emails in a single call

        This method uploads a document with signature fields and recipients,
        then immediately sends signature request emails to all recipients.
        This is the n8n-equivalent "Prepare for Signing" operation.

        Args:
            recipients: List of recipients who will sign
            fields: Signature fields configuration
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
            Document with sign URLs for each recipient

        Example:
            >>> result = await TurboSign.prepare_for_signing_single(
            ...     file=pdf_bytes,
            ...     recipients=[{"name": "John Doe", "email": "john@example.com", "order": 1}],
            ...     fields=[{"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 1}]
            ... )
            >>> print(result["recipients"][0]["signUrl"])
        """
        client = cls._get_client()

        # Serialize recipients and fields to JSON strings (as n8n node does)
        form_data: Dict[str, Any] = {
            "recipients": json.dumps(recipients),
            "fields": json.dumps(fields),
        }

        # Add optional fields
        if document_name:
            form_data["documentName"] = document_name
        if document_description:
            form_data["documentDescription"] = document_description
        if sender_name:
            form_data["senderName"] = sender_name
        if sender_email:
            form_data["senderEmail"] = sender_email
        if cc_emails:
            form_data["ccEmails"] = ",".join(cc_emails)

        # Handle different file input methods
        if file:
            response = await client.upload_file(
                "/turbosign/single/prepare-for-signing",
                file=file,
                file_name=file_name or "document.pdf",
                additional_data=form_data
            )
        else:
            # URL, deliverable, or template
            if file_link:
                form_data["fileLink"] = file_link
            if deliverable_id:
                form_data["deliverableId"] = deliverable_id
            if template_id:
                form_data["templateId"] = template_id

            response = await client.post(
                "/turbosign/single/prepare-for-signing",
                data=form_data
            )

        return response.get("data", response)

    @classmethod
    async def get_status(cls, document_id: str) -> Dict[str, Any]:
        """
        Get the status of a document

        Args:
            document_id: ID of the document

        Returns:
            Document status and recipient information

        Example:
            >>> status = await TurboSign.get_status("doc-123")
            >>> print(status["status"])  # 'pending', 'completed', etc.
        """
        client = cls._get_client()
        response = await client.get(f"/turbosign/documents/{document_id}/status")
        return response.get("data", response)

    @classmethod
    async def download(cls, document_id: str) -> bytes:
        """
        Download the signed document

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
        return await client.get(f"/turbosign/documents/{document_id}/download")

    @classmethod
    async def void_document(cls, document_id: str, reason: str) -> Dict[str, Any]:
        """
        Void a document (cancel signature request)

        Args:
            document_id: ID of the document to void
            reason: Reason for voiding the document

        Returns:
            Void confirmation

        Example:
            >>> result = await TurboSign.void_document("doc-123", "Document needs revision")
        """
        client = cls._get_client()
        response = await client.post(
            f"/turbosign/documents/{document_id}/void",
            data={"reason": reason}
        )
        return response.get("data", response)

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
            Resend confirmation

        Example:
            >>> result = await TurboSign.resend_email("doc-123", ["rec-1", "rec-2"])
        """
        client = cls._get_client()
        response = await client.post(
            f"/turbosign/documents/{document_id}/resend-email",
            data={"recipientIds": recipient_ids}
        )
        return response.get("data", response)
