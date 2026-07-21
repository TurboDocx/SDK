"""
HTTP Client Configuration Tests

Tests for configuration validation including senderEmail/senderName requirements
"""

import os
import pytest
from turbodocx_sdk.http import HttpClient, ValidationError, AuthenticationError, NetworkError


@pytest.fixture(autouse=True)
def clear_env_vars():
    """Clear environment variables before each test"""
    env_vars = [
        "TURBODOCX_API_KEY",
        "TURBODOCX_ORG_ID",
        "TURBODOCX_SENDER_EMAIL",
        "TURBODOCX_SENDER_NAME",
        "TURBODOCX_BASE_URL",
    ]
    for var in env_vars:
        if var in os.environ:
            del os.environ[var]
    yield


class TestSenderEmailValidation:
    """Tests for sender_email validation"""

    def test_should_raise_validation_error_when_sender_email_missing(self):
        """Should throw ValidationError when sender_email is not provided"""
        with pytest.raises(ValidationError) as exc_info:
            HttpClient(
                api_key="test-api-key",
                org_id="test-org-id",
                # sender_email intentionally missing
            )
        assert "sender_email is required" in str(exc_info.value).lower()

    def test_should_raise_validation_error_with_descriptive_message(self):
        """Should throw ValidationError with descriptive message"""
        with pytest.raises(ValidationError) as exc_info:
            HttpClient(
                api_key="test-api-key",
                org_id="test-org-id",
            )
        error_msg = str(exc_info.value).lower()
        assert "sender_email is required" in error_msg
        assert "reply-to address" in error_msg
        # The message no longer promises a fallback sender: the API rejects a send with no
        # sender email instead of mailing from the synthetic API-service address.
        assert "audit trail" in error_msg

    def test_should_accept_valid_sender_email(self):
        """Should accept valid sender_email"""
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
        )
        assert client is not None

    def test_should_read_sender_email_from_environment(self):
        """Should read sender_email from environment variable"""
        os.environ["TURBODOCX_API_KEY"] = "test-api-key"
        os.environ["TURBODOCX_ORG_ID"] = "test-org-id"
        os.environ["TURBODOCX_SENDER_EMAIL"] = "support@company.com"

        client = HttpClient()
        assert client is not None

    def test_should_prioritize_config_over_environment(self):
        """Should prioritize config over environment variable"""
        os.environ["TURBODOCX_SENDER_EMAIL"] = "env@company.com"

        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="config@company.com",
        )

        config = client.get_sender_config()
        assert config["sender_email"] == "config@company.com"


class TestSenderNameConfiguration:
    """Tests for sender_name configuration"""

    def test_should_not_raise_error_when_sender_name_missing(self):
        """Should not throw error when sender_name is not provided"""
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
            # sender_name intentionally missing (optional)
        )
        assert client is not None

    def test_should_accept_sender_name_when_provided(self):
        """Should accept sender_name when provided"""
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
            sender_name="Company Support Team",
        )

        config = client.get_sender_config()
        assert config["sender_name"] == "Company Support Team"

    def test_should_read_sender_name_from_environment(self):
        """Should read sender_name from environment variable"""
        os.environ["TURBODOCX_API_KEY"] = "test-api-key"
        os.environ["TURBODOCX_ORG_ID"] = "test-org-id"
        os.environ["TURBODOCX_SENDER_EMAIL"] = "support@company.com"
        os.environ["TURBODOCX_SENDER_NAME"] = "Company Support"

        client = HttpClient()
        config = client.get_sender_config()
        assert config["sender_name"] == "Company Support"

    def test_should_prioritize_config_over_environment_for_sender_name(self):
        """Should prioritize config over environment variable for sender_name"""
        os.environ["TURBODOCX_SENDER_NAME"] = "Env Name"

        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
            sender_name="Config Name",
        )

        config = client.get_sender_config()
        assert config["sender_name"] == "Config Name"


class TestExistingValidation:
    """Tests for existing validation (API key and orgId)"""

    def test_should_raise_authentication_error_when_api_key_missing(self):
        """Should throw AuthenticationError when API key is missing"""
        with pytest.raises(AuthenticationError):
            HttpClient(
                org_id="test-org-id",
                sender_email="support@company.com",
                # api_key intentionally missing
            )

    def test_should_accept_access_token_instead_of_api_key(self):
        """Should accept access_token instead of API key"""
        client = HttpClient(
            access_token="test-access-token",
            org_id="test-org-id",
            sender_email="support@company.com",
        )
        assert client is not None

    def test_http_client_without_org_id_does_not_raise(self):
        """Should NOT raise when org_id is missing — orgId is optional, backend returns 401 if needed"""
        client = HttpClient(
            api_key="test-api-key",
            sender_email="support@company.com",
            # org_id intentionally missing — should be fine
        )
        assert client is not None
        assert client.org_id is None


class TestGetSenderConfig:
    """Tests for get_sender_config method"""

    def test_should_return_sender_email_and_sender_name(self):
        """Should return sender_email and sender_name"""
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
            sender_name="Company Support",
        )

        config = client.get_sender_config()
        assert config == {
            "sender_email": "support@company.com",
            "sender_name": "Company Support",
        }

    def test_should_return_none_for_sender_name_when_not_provided(self):
        """Should return None for sender_name when not provided"""
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
        )

        config = client.get_sender_config()
        assert config["sender_email"] == "support@company.com"
        assert config["sender_name"] is None


class TestFullConfiguration:
    """Tests for full configuration"""

    def test_should_accept_all_configuration_options(self):
        """Should accept all configuration options"""
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            base_url="https://custom-api.example.com",
            sender_email="support@company.com",
            sender_name="Company Support Team",
        )

        config = client.get_sender_config()
        assert config["sender_email"] == "support@company.com"
        assert config["sender_name"] == "Company Support Team"

    def test_should_use_default_base_url_when_not_provided(self):
        """Should use default baseUrl when not provided"""
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
        )

        assert client.base_url == "https://api.turbodocx.com"


class TestExceptionChaining:
    """Tests that SDK exceptions preserve the original cause for debugging"""

    @pytest.mark.asyncio
    async def test_network_error_preserves_cause_on_timeout(self):
        """NetworkError should chain the original httpx.TimeoutException via __cause__"""
        import httpx

        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
        )

        with pytest.raises(NetworkError) as exc_info:
            # Force a timeout by mocking httpx.AsyncClient
            from unittest.mock import AsyncMock, patch, MagicMock

            mock_response = MagicMock()
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(side_effect=httpx.TimeoutException("connection timed out"))

            with patch("httpx.AsyncClient") as mock_cls:
                mock_cls.return_value.__aenter__.return_value = mock_client
                await client.get("/test")

        assert exc_info.value.__cause__ is not None
        assert isinstance(exc_info.value.__cause__, httpx.TimeoutException)

    @pytest.mark.asyncio
    async def test_network_error_preserves_cause_on_connection_failure(self):
        """NetworkError should chain the original httpx.NetworkError via __cause__"""
        import httpx
        from unittest.mock import AsyncMock, patch

        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
        )

        with pytest.raises(NetworkError) as exc_info:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(
                side_effect=httpx.ConnectError("Connection refused")
            )

            with patch("httpx.AsyncClient") as mock_cls:
                mock_cls.return_value.__aenter__.return_value = mock_client
                await client.get("/test")

        assert exc_info.value.__cause__ is not None

    @pytest.mark.asyncio
    async def test_network_error_preserves_cause_on_unexpected_error(self):
        """NetworkError should chain unexpected exceptions via __cause__"""
        from unittest.mock import AsyncMock, patch

        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="support@company.com",
        )

        with pytest.raises(NetworkError) as exc_info:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(
                side_effect=RuntimeError("unexpected failure")
            )

            with patch("httpx.AsyncClient") as mock_cls:
                mock_cls.return_value.__aenter__.return_value = mock_client
                await client.post("/test", {"key": "value"})

        assert exc_info.value.__cause__ is not None
        assert isinstance(exc_info.value.__cause__, RuntimeError)
