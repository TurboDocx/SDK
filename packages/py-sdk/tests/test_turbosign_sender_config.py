"""
TurboSign Sender Configuration Tests

Tests to ensure sender_email/sender_name from configuration are properly used
in signature requests, with per-request override capability
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from turbodocx_sdk.modules.sign import TurboSign


@pytest.fixture
def mock_http_client():
    """Create a mock HTTP client"""
    with patch("turbodocx_sdk.modules.sign.HttpClient") as MockHttpClient:
        mock_client = Mock()
        mock_client.get_sender_config = Mock(
            return_value={
                "sender_email": "configured@company.com",
                "sender_name": "Configured Support",
            }
        )
        mock_client.post = AsyncMock(
            return_value={
                "success": True,
                "documentId": "doc-123",
                "status": "review_ready",
                "message": "Document prepared",
            }
        )
        mock_client.upload_file = AsyncMock(
            return_value={
                "success": True,
                "documentId": "doc-upload",
                "status": "review_ready",
                "message": "Document prepared",
            }
        )
        MockHttpClient.return_value = mock_client
        TurboSign.configure(
            api_key="test-key",
            org_id="test-org",
            sender_email="configured@company.com",
            sender_name="Configured Support",
        )
        yield mock_client


@pytest.fixture
def mock_recipients():
    """Sample recipients for testing"""
    return [{"name": "John Doe", "email": "john@example.com", "signingOrder": 1}]


@pytest.fixture
def mock_fields():
    """Sample fields for testing"""
    return [
        {
            "type": "signature",
            "page": 1,
            "x": 100,
            "y": 500,
            "width": 200,
            "height": 50,
            "recipientEmail": "john@example.com",
        }
    ]


class TestCreateSignatureReviewLinkWithConfiguredSender:
    """Tests for createSignatureReviewLink with configured sender"""

    @pytest.mark.asyncio
    async def test_should_use_configured_sender_email_when_not_provided_in_request(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should use configured sender_email when not provided in request"""
        await TurboSign.create_signature_review_link(
            file_link="https://example.com/doc.pdf",
            recipients=mock_recipients,
            fields=mock_fields,
            # sender_email and sender_name NOT provided
        )

        call_args = mock_http_client.post.call_args
        form_data = call_args[1]["data"]
        assert form_data["senderEmail"] == "configured@company.com"
        assert form_data["senderName"] == "Configured Support"

    @pytest.mark.asyncio
    async def test_should_use_configured_sender_email_only_when_sender_name_not_configured(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should use configured sender_email only when sender_name not configured"""
        mock_http_client.get_sender_config.return_value = {
            "sender_email": "configured@company.com",
            "sender_name": None,
        }

        await TurboSign.create_signature_review_link(
            file_link="https://example.com/doc.pdf",
            recipients=mock_recipients,
            fields=mock_fields,
        )

        call_args = mock_http_client.post.call_args
        form_data = call_args[1]["data"]
        assert form_data["senderEmail"] == "configured@company.com"
        assert "senderName" not in form_data

    @pytest.mark.asyncio
    async def test_should_override_configured_sender_with_request_level_sender(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should override configured sender with request-level sender"""
        await TurboSign.create_signature_review_link(
            file_link="https://example.com/doc.pdf",
            recipients=mock_recipients,
            fields=mock_fields,
            sender_email="override@company.com",
            sender_name="Override Support",
        )

        call_args = mock_http_client.post.call_args
        form_data = call_args[1]["data"]
        assert form_data["senderEmail"] == "override@company.com"
        assert form_data["senderName"] == "Override Support"

    @pytest.mark.asyncio
    async def test_should_partially_override_use_request_sender_email_but_configured_sender_name(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should use request sender_email but configured sender_name"""
        await TurboSign.create_signature_review_link(
            file_link="https://example.com/doc.pdf",
            recipients=mock_recipients,
            fields=mock_fields,
            sender_email="override@company.com",
            # sender_name NOT provided - should use configured value
        )

        call_args = mock_http_client.post.call_args
        form_data = call_args[1]["data"]
        assert form_data["senderEmail"] == "override@company.com"
        assert form_data["senderName"] == "Configured Support"


class TestSendSignatureWithConfiguredSender:
    """Tests for sendSignature with configured sender"""

    @pytest.mark.asyncio
    async def test_should_use_configured_sender_email_and_sender_name(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should use configured sender_email and sender_name"""
        mock_http_client.post.return_value = {
            "success": True,
            "documentId": "doc-123",
            "message": "Document sent for signing",
        }

        await TurboSign.send_signature(
            file_link="https://example.com/doc.pdf",
            recipients=mock_recipients,
            fields=mock_fields,
        )

        call_args = mock_http_client.post.call_args
        form_data = call_args[1]["data"]
        assert form_data["senderEmail"] == "configured@company.com"
        assert form_data["senderName"] == "Configured Support"

    @pytest.mark.asyncio
    async def test_should_allow_request_level_override_in_send_signature(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should allow request-level override in sendSignature"""
        mock_http_client.post.return_value = {
            "success": True,
            "documentId": "doc-123",
            "message": "Document sent for signing",
        }

        await TurboSign.send_signature(
            file_link="https://example.com/doc.pdf",
            recipients=mock_recipients,
            fields=mock_fields,
            sender_email="sales@company.com",
            sender_name="Sales Team",
        )

        call_args = mock_http_client.post.call_args
        form_data = call_args[1]["data"]
        assert form_data["senderEmail"] == "sales@company.com"
        assert form_data["senderName"] == "Sales Team"


class TestFileUploadWithConfiguredSender:
    """Tests for file upload with configured sender"""

    @pytest.mark.asyncio
    async def test_should_use_configured_sender_in_file_upload_requests(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should use configured sender in file upload requests"""
        mock_file = b"mock-pdf-content"

        await TurboSign.create_signature_review_link(
            file=mock_file,
            recipients=mock_recipients,
            fields=mock_fields,
        )

        call_args = mock_http_client.upload_file.call_args
        additional_data = call_args[1]["additional_data"]
        assert additional_data["senderEmail"] == "configured@company.com"
        assert additional_data["senderName"] == "Configured Support"

    @pytest.mark.asyncio
    async def test_should_override_configured_sender_in_file_upload_requests(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should override configured sender in file upload requests"""
        mock_file = b"mock-pdf-content"

        await TurboSign.create_signature_review_link(
            file=mock_file,
            recipients=mock_recipients,
            fields=mock_fields,
            sender_email="specific@company.com",
            sender_name="Specific Team",
        )

        call_args = mock_http_client.upload_file.call_args
        additional_data = call_args[1]["additional_data"]
        assert additional_data["senderEmail"] == "specific@company.com"
        assert additional_data["senderName"] == "Specific Team"


class TestGetSenderConfigCalled:
    """Tests to ensure get_sender_config is called correctly"""

    @pytest.mark.asyncio
    async def test_should_call_get_sender_config_once_per_request(
        self, mock_http_client, mock_recipients, mock_fields
    ):
        """Should call get_sender_config once per request"""
        await TurboSign.create_signature_review_link(
            file_link="https://example.com/doc.pdf",
            recipients=mock_recipients,
            fields=mock_fields,
        )

        assert mock_http_client.get_sender_config.call_count == 1
