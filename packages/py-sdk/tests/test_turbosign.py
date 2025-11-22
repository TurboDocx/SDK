"""
TurboSign Module Tests

Tests for 100% parity with n8n-nodes-turbodocx operations:
- prepare_for_review
- prepare_for_signing_single
- get_status
- download
- void_document
- resend_email
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from turbodocx_sdk import TurboSign


class TestTurboSignConfigure:
    """Test TurboSign configuration"""

    def test_configure_with_api_key(self):
        """Should configure the client with API key"""
        TurboSign.configure(api_key="test-api-key")
        assert TurboSign._client is not None
        assert TurboSign._client.api_key == "test-api-key"

    def test_configure_with_custom_base_url(self):
        """Should configure with custom base URL"""
        TurboSign.configure(
            api_key="test-api-key",
            base_url="https://custom-api.example.com"
        )
        assert TurboSign._client.base_url == "https://custom-api.example.com"


class TestPrepareForReview:
    """Test prepare_for_review operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboSign._client = None

    def mock_recipients(self):
        return [{"name": "John Doe", "email": "john@example.com", "order": 1}]

    def mock_fields(self):
        return [{
            "type": "signature",
            "page": 1,
            "x": 100,
            "y": 500,
            "width": 200,
            "height": 50,
            "recipientOrder": 1
        }]

    @pytest.mark.asyncio
    async def test_prepare_for_review_with_file_upload(self):
        """Should prepare document for review with file upload"""
        mock_response = {
            "data": {
                "documentId": "doc-123",
                "status": "review_ready",
                "previewUrl": "https://preview.example.com/doc-123",
                "recipients": [{
                    "id": "rec-1",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "status": "pending"
                }]
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.prepare_for_review(
                file=b"mock-pdf-content",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-123"
            assert result["status"] == "review_ready"
            assert result.get("previewUrl") is not None

    @pytest.mark.asyncio
    async def test_prepare_for_review_with_file_url(self):
        """Should prepare document for review with file URL"""
        mock_response = {
            "data": {
                "documentId": "doc-456",
                "status": "review_ready",
                "previewUrl": "https://preview.example.com/doc-456"
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.prepare_for_review(
                file_link="https://storage.example.com/contract.pdf",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-456"
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert "fileLink" in call_args[1]["data"]

    @pytest.mark.asyncio
    async def test_prepare_for_review_with_deliverable_id(self):
        """Should prepare document for review with deliverable ID"""
        mock_response = {
            "data": {
                "documentId": "doc-789",
                "status": "review_ready"
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.prepare_for_review(
                deliverable_id="deliverable-abc",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-789"
            call_args = mock_client.post.call_args
            assert "deliverableId" in call_args[1]["data"]

    @pytest.mark.asyncio
    async def test_prepare_for_review_with_template_id(self):
        """Should prepare document for review with template ID"""
        mock_response = {
            "data": {
                "documentId": "doc-template",
                "status": "review_ready"
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.prepare_for_review(
                template_id="template-xyz",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-template"

    @pytest.mark.asyncio
    async def test_prepare_for_review_with_optional_fields(self):
        """Should include optional fields in request"""
        mock_response = {"data": {"documentId": "doc-123", "status": "review_ready"}}

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            await TurboSign.prepare_for_review(
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


class TestPrepareForSigningSingle:
    """Test prepare_for_signing_single operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboSign._client = None

    def mock_recipients(self):
        return [{"name": "John Doe", "email": "john@example.com", "order": 1}]

    def mock_fields(self):
        return [{
            "type": "signature",
            "page": 1,
            "x": 100,
            "y": 500,
            "width": 200,
            "height": 50,
            "recipientOrder": 1
        }]

    @pytest.mark.asyncio
    async def test_prepare_for_signing_and_send_emails(self):
        """Should prepare document for signing and send emails"""
        mock_response = {
            "data": {
                "documentId": "doc-123",
                "status": "sent",
                "recipients": [{
                    "id": "rec-1",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "status": "pending",
                    "signUrl": "https://sign.example.com/rec-1"
                }]
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.prepare_for_signing_single(
                file_link="https://storage.example.com/contract.pdf",
                recipients=self.mock_recipients(),
                fields=self.mock_fields()
            )

            assert result["documentId"] == "doc-123"
            assert result["status"] == "sent"
            assert result["recipients"][0].get("signUrl") is not None
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert "/turbosign/single/prepare-for-signing" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_handle_file_upload_for_signing(self):
        """Should handle file upload for signing"""
        mock_response = {
            "data": {
                "documentId": "doc-upload",
                "status": "sent"
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.upload_file = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.prepare_for_signing_single(
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
            "data": {
                "documentId": "doc-123",
                "status": "pending",
                "name": "Test Document",
                "recipients": [{
                    "id": "rec-1",
                    "name": "John Doe",
                    "email": "john@example.com",
                    "status": "pending"
                }],
                "createdAt": "2024-01-01T00:00:00Z",
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.get_status("doc-123")

            assert result["documentId"] == "doc-123"
            assert result["status"] == "pending"
            mock_client.get.assert_called_once_with("/turbosign/documents/doc-123/status")


class TestDownload:
    """Test download operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_download_signed_document(self):
        """Should download signed document"""
        mock_pdf_content = b"%PDF-mock-content"

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_pdf_content)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.download("doc-123")

            assert result == mock_pdf_content
            mock_client.get.assert_called_once_with("/turbosign/documents/doc-123/download")


class TestVoid:
    """Test void operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_void_document_with_reason(self):
        """Should void a document with reason"""
        mock_response = {
            "data": {
                "documentId": "doc-123",
                "status": "voided",
                "voidedAt": "2024-01-01T12:00:00Z"
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.void_document("doc-123", "Document needs revision")

            assert result["documentId"] == "doc-123"
            assert result["status"] == "voided"
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
            "data": {
                "documentId": "doc-123",
                "message": "Emails resent successfully",
                "resentAt": "2024-01-01T12:00:00Z"
            }
        }

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            result = await TurboSign.resend_email("doc-123", ["rec-1", "rec-2"])

            assert "resent" in result["message"]
            mock_client.post.assert_called_once_with(
                "/turbosign/documents/doc-123/resend-email",
                data={"recipientIds": ["rec-1", "rec-2"]}
            )


class TestErrorHandling:
    """Test error handling"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboSign._client = None

    @pytest.mark.asyncio
    async def test_throw_error_when_api_key_not_configured(self):
        """Should throw error when API key is not configured"""
        with pytest.raises(Exception):
            await TurboSign.get_status("doc-123")

    @pytest.mark.asyncio
    async def test_handle_api_errors_gracefully(self):
        """Should handle API errors gracefully"""
        api_error = Exception("Document not found")

        with patch.object(TurboSign, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(side_effect=api_error)
            mock_get_client.return_value = mock_client

            TurboSign.configure(api_key="test-key")
            with pytest.raises(Exception, match="Document not found"):
                await TurboSign.get_status("invalid-doc")
