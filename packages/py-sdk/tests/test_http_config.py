"""
HTTP Client Configuration Tests

Tests for configuration validation including senderEmail/senderName requirements
"""

import os
import pytest
from turbodocx_sdk.http import HttpClient, AuthenticationError


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

    def test_should_not_throw_when_sender_email_missing(self):
        """Should not throw when sender_email is not provided (optional in HttpClient)"""
        # Note: sender_email validation is done in TurboSign.configure(), not HttpClient
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
            # sender_email intentionally missing - this is valid for HttpClient
        )
        assert client is not None

    def test_should_return_none_for_sender_email_when_not_provided(self):
        """Should return None for sender_email when not provided"""
        client = HttpClient(
            api_key="test-api-key",
            org_id="test-org-id",
        )
        config = client.get_sender_config()
        assert config["sender_email"] is None

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

    def test_should_raise_when_org_id_missing(self):
        """Should raise when org_id is missing"""
        with pytest.raises(AuthenticationError):
            HttpClient(
                api_key="test-api-key",
                sender_email="support@company.com",
                # org_id intentionally missing
            )


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
