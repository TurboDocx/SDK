"""
TurboSign Module Tests

Tests for TurboSign operations:
- create_signature_review_link
- send_signature
- get_status
- download
- void_document
- resend_email
- get_audit_trail
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from turbodocx_sdk import TurboSign, ValidationError, NotFoundError, AuthenticationError


class TestTurboSignConfigure:
    """Test TurboSign configuration"""

    def test_configure_with_api_key_and_org_id(self):
        """Should configure the client with API key and org ID"""
        TurboSign.configure(api_key="test-api-key", org_id="test-org-id", sender_email="test@example.com")
        assert TurboSign._client is not None
        assert TurboSign._client.api_key == "test-api-key"
        assert TurboSign._client.org_id == "test-org-id"

    def test_configure_with_custom_base_url(self):
        """Should configure with custom base URL"""
        TurboSign.configure(
            api_key="test-api-key",
            org_id="test-org-id",
            base_url="https://custom-api.example.com",
            sender_email="test@example.com"
        )
        assert TurboSign._client.base_url == "https://custom-api.example.com"

    def test_configure_requires_org_id(self):
        """Should raise error when org_id is not provided"""
        with pytest.raises(AuthenticationError, match="Organization ID"):
            TurboSign.configure(api_key="test-api-key", sender_email="test@example.com")


class TestCreateSignatureReviewLink:
    """Test create_signature_review_link operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboSign._client = None

    def mock_recipients(self):
        return [{"name": "John Doe", "email": "john@example.com", "signingOrder": 1}]

    def mock_fields(self):
        return [{
            "type": "signature",
            "page": 1,
            "x": 100,
            "y": 500,
            "width": 200,
            "height": 50,
            "recipientEmail": "john@example.com"
        }]

    @pytest.mark.asyncio
    async def test_create_signature_review_link_with_file_upload(self):
        """Should prepare document for review with file upload"""
        mock_response = {
            "success": True,
            "documentId": "doc-123",
            "status": "review_ready",
            "previewUrl": "https://preview.example.com/doc-123",
            "message": "Document prepared for review",
            "recipients": [{
                "id": "rec-1",
                "name": "John Doe",
                "email": "john@example.com",
                "status": "pending"
            }]
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.create_signature_review_link(
                file=b"mock-pdf-content",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["success"] is True
            assert result["documentId"] == "doc-123"
            assert result["status"] == "review_ready"
            assert result.get("previewUrl") is not None

    @pytest.mark.asyncio
    async def test_create_signature_review_link_with_file_url(self):
        """Should prepare document for review with file URL"""
        mock_response = {
            "success": True,
            "documentId": "doc-456",
            "status": "review_ready",
            "previewUrl": "https://preview.example.com/doc-456",
            "message": "Document prepared for review"
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.create_signature_review_link(
                file_link="https://storage.example.com/contract.pdf",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-456"
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert "fileLink" in call_args[1]["data"]

    @pytest.mark.asyncio
    async def test_create_signature_review_link_with_deliverable_id(self):
        """Should prepare document for review with deliverable ID"""
        mock_response = {
            "success": True,
            "documentId": "doc-789",
            "status": "review_ready",
            "message": "Document prepared for review"
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.create_signature_review_link(
                deliverable_id="deliverable-abc",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-789"
            call_args = mock_client.post.call_args
            assert "deliverableId" in call_args[1]["data"]

    @pytest.mark.asyncio
    async def test_create_signature_review_link_with_template_id(self):
        """Should prepare document for review with template ID"""
        mock_response = {
            "success": True,
            "documentId": "doc-template",
            "status": "review_ready",
            "message": "Document prepared for review"
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.create_signature_review_link(
                template_id="template-xyz",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-template"

    @pytest.mark.asyncio
    async def test_create_signature_review_link_with_optional_fields(self):
        """Should include optional fields in request"""
        mock_response = {
            "success": True,
            "documentId": "doc-123",
            "status": "review_ready",
            "message": "Document prepared for review"
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            await TurboSign.create_signature_review_link(
                file_link="https://example.com/doc.pdf",
                recipients=self.mock_recipients(),
                fields=self.mock_fields(),
                document_name="Test Contract",
                document_description="A test contract",
                sender_name="Sales Team",
                sender_email="sales@company.com",
                cc_emails=["admin@company.com", "legal@company.com"]
            )

            call_args = mock_client.post.call_args
            data = call_args[1]["data"]
            assert data.get("documentName") == "Test Contract"
            assert data.get("documentDescription") == "A test contract"
            assert data.get("senderName") == "Sales Team"
            assert data.get("senderEmail") == "sales@company.com"


class TestSendSignature:
    """Test send_signature operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboSign._client = None

    def mock_recipients(self):
        return [{"name": "John Doe", "email": "john@example.com", "signingOrder": 1}]

    def mock_fields(self):
        return [{
            "type": "signature",
            "page": 1,
            "x": 100,
            "y": 500,
            "width": 200,
            "height": 50,
            "recipientEmail": "john@example.com"
        }]

    @pytest.mark.asyncio
    async def test_send_signature_with_emails(self):
        """Should prepare document for signing and send emails"""
        mock_response = {
            "success": True,
            "documentId": "doc-123",
            "message": "Document sent for signing"
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.send_signature(
                file_link="https://storage.example.com/contract.pdf",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["success"] is True
            assert result["documentId"] == "doc-123"
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert "/turbosign/single/prepare-for-signing" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_handle_file_upload_for_signing(self):
        """Should handle file upload for signing"""
        mock_response = {
            "success": True,
            "documentId": "doc-upload",
            "message": "Document sent for signing"
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.send_signature(
                file=b"mock-pdf-content",
                file_name="contract.pdf",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-upload"


class TestGetStatus:
    """Test get_status operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_get_document_status(self):
        """Should get document status"""
        mock_response = {
            "status": "pending"
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.get_status("doc-123")

            assert result["status"] == "pending"
            mock_client.get.assert_called_once_with("/turbosign/documents/doc-123/status")


class TestDownload:
    """Test download operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_download_signed_document(self):
        """Should download signed document via presigned URL"""
        mock_api_response = {
            "downloadUrl": "https://s3.amazonaws.com/bucket/signed-doc.pdf?presigned=token",
            "fileName": "signed-document.pdf"
        }
        mock_pdf_content = b"%PDF-mock-content"

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_api_response)
            mock_get_client.return_value = mock_client

            with patch('httpx.AsyncClient') as mock_httpx:
                mock_http_client = AsyncMock()
                mock_response = MagicMock()
                mock_response.is_success = True
                mock_response.content = mock_pdf_content
                mock_http_client.get = AsyncMock(return_value=mock_response)
                mock_httpx.return_value.__aenter__.return_value = mock_http_client

                TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
                result = await TurboSign.download("doc-123")

                assert result == mock_pdf_content
                mock_client.get.assert_called_once_with("/turbosign/documents/doc-123/download")
                mock_http_client.get.assert_called_once_with(mock_api_response["downloadUrl"])


class TestVoid:
    """Test void operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_void_document_with_reason(self):
        """Should void a document with reason"""
        # Backend returns empty response, SDK sets success/message manually
        mock_response = {}

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.void_document("doc-123", "Document needs revision")

            assert result["success"] is True
            assert result["message"] == "Document has been voided successfully"
            mock_client.post.assert_called_once_with(
                "/turbosign/documents/doc-123/void",
                data={"reason": "Document needs revision"}
            )


class TestResend:
    """Test resend operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_resend_email_to_specific_recipients(self):
        """Should resend email to specific recipients"""
        mock_response = {
            "success": True,
            "recipientCount": 2
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.resend_email("doc-123", ["rec-1", "rec-2"])

            assert result["success"] is True
            assert result["recipientCount"] == 2
            mock_client.post.assert_called_once_with(
                "/turbosign/documents/doc-123/resend-email",
                data={"recipientIds": ["rec-1", "rec-2"]}
            )


class TestGetAuditTrail:
    """Test get_audit_trail operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_get_audit_trail(self):
        """Should get audit trail for document"""
        mock_response = {
            "document": {
                "id": "doc-123",
                "name": "Test Document"
            },
            "auditTrail": [
                {
                    "id": "audit-1",
                    "documentId": "doc-123",
                    "actionType": "document_created",
                    "timestamp": "2024-01-01T00:00:00Z"
                },
                {
                    "id": "audit-2",
                    "documentId": "doc-123",
                    "actionType": "email_sent",
                    "timestamp": "2024-01-01T00:01:00Z"
                }
            ]
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            result = await TurboSign.get_audit_trail("doc-123")

            assert result["document"]["id"] == "doc-123"
            assert result["document"]["name"] == "Test Document"
            assert len(result["auditTrail"]) == 2
            assert result["auditTrail"][0]["actionType"] == "document_created"
            mock_client.get.assert_called_once_with("/turbosign/documents/doc-123/audit-trail")


class TestErrorHandling:
    """Test error handling"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_throw_error_when_not_configured(self):
        """Should throw error when not configured"""
        with pytest.raises(RuntimeError, match="not configured"):
            await TurboSign.get_status("doc-123")

    @pytest.mark.asyncio
    async def test_handle_not_found_error(self):
        """Should handle not found errors"""
        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(side_effect=NotFoundError("Document not found"))
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            with pytest.raises(NotFoundError, match="Document not found"):
                await TurboSign.get_status("invalid-doc")

    @pytest.mark.asyncio
    async def test_handle_validation_error(self):
        """Should handle validation errors"""
        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(side_effect=ValidationError("Invalid email format"))
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key", org_id="test-org", sender_email="test@example.com")
            with pytest.raises(ValidationError, match="Invalid email"):
                await TurboSign.send_signature(
                    file_link="https://example.com/doc.pdf",
                    recipients=[{"name": "Test", "email": "invalid-email", "signingOrder": 1}],
                    fields=[]
                )
