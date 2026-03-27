"""
Deliverable Module Tests

Tests for Deliverable operations:
- list_deliverables
- generate_deliverable
- get_deliverable_details
- update_deliverable_info
- delete_deliverable
- download_source_file
- download_pdf
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from turbodocx_sdk import Deliverable, AuthenticationError


class TestDeliverableConfigure:
    """Test Deliverable configuration"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    def test_configure_with_api_key_and_org_id(self):
        """Should configure the client with API key and org ID (no senderEmail needed)"""
        Deliverable.configure(api_key="test-api-key", org_id="test-org-id")
        assert Deliverable._client is not None
        assert Deliverable._client.api_key == "test-api-key"
        assert Deliverable._client.org_id == "test-org-id"

    def test_configure_with_custom_base_url(self):
        """Should configure with custom base URL"""
        Deliverable.configure(
            api_key="test-api-key",
            org_id="test-org-id",
            base_url="https://custom-api.example.com",
        )
        assert Deliverable._client.base_url == "https://custom-api.example.com"

    def test_configure_does_not_require_sender_email(self):
        """Should not require sender_email (unlike TurboSign)"""
        Deliverable.configure(api_key="test-api-key", org_id="test-org-id")
        assert Deliverable._client is not None

    def test_configure_requires_api_key(self):
        """Should raise error when api_key is not provided"""
        with pytest.raises(AuthenticationError, match="API key or access token"):
            Deliverable.configure(org_id="test-org-id")

    def test_configure_requires_org_id(self):
        """Should raise error when org_id is not provided"""
        with pytest.raises(AuthenticationError, match="Organization ID"):
            Deliverable.configure(api_key="test-api-key")


class TestListDeliverables:
    """Test list_deliverables operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    @pytest.mark.asyncio
    async def test_list_deliverables(self):
        """Should list deliverables with pagination"""
        mock_response = {
            "results": [
                {"id": "d1", "name": "Contract A", "isActive": True},
                {"id": "d2", "name": "Contract B", "isActive": True},
            ],
            "totalRecords": 2,
        }

        with patch.object(Deliverable, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            Deliverable.configure(api_key="test-key", org_id="test-org")
            result = await Deliverable.list_deliverables(limit=5, show_tags=True)

            assert result["totalRecords"] == 2
            assert len(result["results"]) == 2
            call_args = mock_client.get.call_args[0][0]
            assert "/v1/deliverable?" in call_args
            assert "limit=5" in call_args
            assert "showTags=True" in call_args

    @pytest.mark.asyncio
    async def test_list_deliverables_no_params(self):
        """Should list deliverables without params"""
        mock_response = {"results": [], "totalRecords": 0}

        with patch.object(Deliverable, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            Deliverable.configure(api_key="test-key", org_id="test-org")
            result = await Deliverable.list_deliverables()

            mock_client.get.assert_called_once_with("/v1/deliverable")
            assert result["totalRecords"] == 0


class TestGenerateDeliverable:
    """Test generate_deliverable operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    @pytest.mark.asyncio
    async def test_generate_deliverable(self):
        """Should generate a deliverable from a template"""
        mock_response = {
            "results": {
                "deliverable": {
                    "id": "new-d-id",
                    "name": "Employee Contract",
                    "templateId": "tmpl-1",
                }
            }
        }

        with patch.object(Deliverable, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            Deliverable.configure(api_key="test-key", org_id="test-org")
            result = await Deliverable.generate_deliverable(
                name="Employee Contract",
                template_id="tmpl-1",
                variables=[
                    {"placeholder": "{Name}", "text": "John", "mimeType": "text"},
                ],
                tags=["hr", "contract"],
            )

            assert result["results"]["deliverable"]["id"] == "new-d-id"
            call_args = mock_client.post.call_args
            assert call_args[0][0] == "/v1/deliverable"
            body = call_args[1]["data"]
            assert body["name"] == "Employee Contract"
            assert body["templateId"] == "tmpl-1"
            assert len(body["variables"]) == 1
            assert body["tags"] == ["hr", "contract"]


class TestGetDeliverableDetails:
    """Test get_deliverable_details operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    @pytest.mark.asyncio
    async def test_get_deliverable_details(self):
        """Should get deliverable details and unwrap results"""
        mock_response = {
            "results": {
                "id": "d1",
                "name": "Contract A",
                "templateName": "Standard Contract",
                "variables": [{"placeholder": "{Name}", "text": "John"}],
                "tags": [{"id": "t1", "name": "hr"}],
            }
        }

        with patch.object(Deliverable, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            Deliverable.configure(api_key="test-key", org_id="test-org")
            result = await Deliverable.get_deliverable_details("d1", show_tags=True)

            # Should be unwrapped from results
            assert result["id"] == "d1"
            assert result["name"] == "Contract A"
            assert result["templateName"] == "Standard Contract"
            call_args = mock_client.get.call_args[0][0]
            assert "/v1/deliverable/d1?" in call_args
            assert "showTags=True" in call_args


class TestUpdateDeliverableInfo:
    """Test update_deliverable_info operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    @pytest.mark.asyncio
    async def test_update_deliverable_info(self):
        """Should update deliverable info"""
        mock_response = {
            "message": "Deliverable updated successfully",
            "deliverableId": "d1",
        }

        with patch.object(Deliverable, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.patch = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            Deliverable.configure(api_key="test-key", org_id="test-org")
            result = await Deliverable.update_deliverable_info(
                "d1", name="Updated Name", tags=["finalized"]
            )

            assert result["message"] == "Deliverable updated successfully"
            call_args = mock_client.patch.call_args
            assert call_args[0][0] == "/v1/deliverable/d1"
            body = call_args[1]["data"]
            assert body["name"] == "Updated Name"
            assert body["tags"] == ["finalized"]


class TestDeleteDeliverable:
    """Test delete_deliverable operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    @pytest.mark.asyncio
    async def test_delete_deliverable(self):
        """Should soft-delete a deliverable"""
        mock_response = {
            "message": "Deliverable deleted successfully",
            "deliverableId": "d1",
        }

        with patch.object(Deliverable, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.delete = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            Deliverable.configure(api_key="test-key", org_id="test-org")
            result = await Deliverable.delete_deliverable("d1")

            assert result["message"] == "Deliverable deleted successfully"
            mock_client.delete.assert_called_once_with("/v1/deliverable/d1")


class TestDownloadSourceFile:
    """Test download_source_file operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    @pytest.mark.asyncio
    async def test_download_source_file(self):
        """Should download the source file as bytes"""
        mock_bytes = b"PK\x03\x04mock-docx-content"

        with patch.object(Deliverable, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_raw = AsyncMock(return_value=mock_bytes)
            mock_get_client.return_value = mock_client

            Deliverable.configure(api_key="test-key", org_id="test-org")
            result = await Deliverable.download_source_file("d1")

            assert result == mock_bytes
            mock_client.get_raw.assert_called_once_with("/v1/deliverable/file/d1")


class TestDownloadPDF:
    """Test download_pdf operation"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    @pytest.mark.asyncio
    async def test_download_pdf(self):
        """Should download PDF as bytes"""
        mock_bytes = b"%PDF-mock-content"

        with patch.object(Deliverable, '_get_client') as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_raw = AsyncMock(return_value=mock_bytes)
            mock_get_client.return_value = mock_client

            Deliverable.configure(api_key="test-key", org_id="test-org")
            result = await Deliverable.download_pdf("d1")

            assert result == mock_bytes
            mock_client.get_raw.assert_called_once_with("/v1/deliverable/file/pdf/d1")


class TestErrorHandling:
    """Test error handling"""

    @pytest.fixture(autouse=True)
    def setup(self):
        Deliverable._client = None

    @pytest.mark.asyncio
    async def test_throw_error_when_not_configured(self):
        """Should throw error when not configured"""
        with pytest.raises(RuntimeError, match="not configured"):
            await Deliverable.list_deliverables()

    @pytest.mark.asyncio
    async def test_throw_error_for_all_methods_when_not_configured(self):
        """Should throw error for any method when not configured"""
        with pytest.raises(RuntimeError, match="not configured"):
            await Deliverable.generate_deliverable(
                name="test", template_id="t1", variables=[]
            )

        with pytest.raises(RuntimeError, match="not configured"):
            await Deliverable.get_deliverable_details("d1")

        with pytest.raises(RuntimeError, match="not configured"):
            await Deliverable.download_source_file("d1")

        with pytest.raises(RuntimeError, match="not configured"):
            await Deliverable.download_pdf("d1")
