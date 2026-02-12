"""
TurboTemplate Module Tests

Tests for advanced templating features:
- Helper functions (create_simple_variable, create_advanced_engine_variable, etc.)
- Variable validation
- Generate template functionality
- Placeholder and name handling
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from turbodocx_sdk import TurboTemplate


class TestTurboTemplateConfigure:
    """Test TurboTemplate configuration"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboTemplate._client = None

    def test_configure_with_api_key_and_org_id(self):
        """Should configure the client with API key and org ID"""
        TurboTemplate.configure(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="test@company.com"
        )
        assert TurboTemplate._client is not None
        assert TurboTemplate._client.api_key == "test-api-key"
        assert TurboTemplate._client.org_id == "test-org-id"

    def test_configure_with_custom_base_url(self):
        """Should configure with custom base URL"""
        TurboTemplate.configure(
            api_key="test-api-key",
            org_id="test-org-id",
            sender_email="test@company.com",
            base_url="https://custom-api.example.com",
        )
        assert TurboTemplate._client.base_url == "https://custom-api.example.com"


class TestHelperFunctions:
    """Test helper functions for creating variables"""

    class TestCreateSimpleVariable:
        """Test create_simple_variable helper"""

        def test_create_simple_variable_with_string_value(self):
            """Should create a simple variable with string value"""
            variable = TurboTemplate.create_simple_variable(
                "{customer_name}", "customer_name", "Person A", "text"
            )

            assert variable == {
                "placeholder": "{customer_name}",
                "name": "customer_name",
                "value": "Person A",
                "mimeType": "text",
            }

        def test_create_simple_variable_with_number_value(self):
            """Should create a simple variable with number value"""
            variable = TurboTemplate.create_simple_variable(
                "{order_total}", "order_total", 1500, "text"
            )

            assert variable == {
                "placeholder": "{order_total}",
                "name": "order_total",
                "value": 1500,
                "mimeType": "text",
            }

        def test_create_simple_variable_with_boolean_value(self):
            """Should create a simple variable with boolean value"""
            variable = TurboTemplate.create_simple_variable(
                "{is_active}", "is_active", True, "text"
            )

            assert variable == {
                "placeholder": "{is_active}",
                "name": "is_active",
                "value": True,
                "mimeType": "text",
            }

        def test_create_simple_variable_with_html_mimetype(self):
            """Should create a simple variable with html mimeType"""
            variable = TurboTemplate.create_simple_variable(
                "{content}", "content", "<b>Bold</b>", "html"
            )

            assert variable == {
                "placeholder": "{content}",
                "name": "content",
                "value": "<b>Bold</b>",
                "mimeType": "html",
            }

        def test_create_simple_variable_throws_when_placeholder_missing(self):
            """Should throw error when placeholder is missing"""
            with pytest.raises(ValueError, match="placeholder is required"):
                TurboTemplate.create_simple_variable("", "name", "value", "text")

        def test_create_simple_variable_throws_when_name_missing(self):
            """Should throw error when name is missing"""
            with pytest.raises(ValueError, match="name is required"):
                TurboTemplate.create_simple_variable("{test}", "", "value", "text")

        def test_create_simple_variable_throws_when_mimetype_missing(self):
            """Should throw error when mimeType is missing"""
            with pytest.raises(ValueError, match="mime_type is required"):
                TurboTemplate.create_simple_variable("{test}", "test", "value", "")

        def test_create_simple_variable_throws_when_mimetype_invalid(self):
            """Should throw error when mimeType is invalid"""
            with pytest.raises(ValueError, match="mime_type must be 'text' or 'html'"):
                TurboTemplate.create_simple_variable("{test}", "test", "value", "json")

    class TestCreateAdvancedEngineVariable:
        """Test create_advanced_engine_variable helper"""

        def test_create_advanced_engine_variable_with_object_value(self):
            """Should create a nested variable with object value"""
            variable = TurboTemplate.create_advanced_engine_variable(
                "{user}",
                "user",
                {
                    "firstName": "Foo",
                    "lastName": "Bar",
                    "email": "foo@example.com",
                },
            )

            assert variable["placeholder"] == "{user}"
            assert variable["name"] == "user"
            assert variable["value"] == {
                "firstName": "Foo",
                "lastName": "Bar",
                "email": "foo@example.com",
            }
            assert variable["mimeType"] == "json"
            assert variable["usesAdvancedTemplatingEngine"] is True

        def test_create_advanced_engine_variable_with_deeply_nested_object(self):
            """Should create a nested variable with deeply nested object"""
            variable = TurboTemplate.create_advanced_engine_variable(
                "{company}",
                "company",
                {
                    "name": "Company ABC",
                    "address": {
                        "street": "123 Test Street",
                        "city": "Test City",
                        "state": "TS",
                    },
                },
            )

            assert variable["value"] == {
                "name": "Company ABC",
                "address": {
                    "street": "123 Test Street",
                    "city": "Test City",
                    "state": "TS",
                },
            }
            assert variable["mimeType"] == "json"
            assert variable["usesAdvancedTemplatingEngine"] is True

        def test_create_advanced_engine_variable_throws_when_placeholder_missing(self):
            """Should throw error when placeholder is missing"""
            with pytest.raises(ValueError, match="placeholder is required"):
                TurboTemplate.create_advanced_engine_variable("", "user", {"name": "Test"})

        def test_create_advanced_engine_variable_throws_when_name_missing(self):
            """Should throw error when name is missing"""
            with pytest.raises(ValueError, match="name is required"):
                TurboTemplate.create_advanced_engine_variable("{user}", "", {"name": "Test"})

    class TestCreateLoopVariable:
        """Test create_loop_variable helper"""

        def test_create_loop_variable_with_array_value(self):
            """Should create a loop variable with array value"""
            variable = TurboTemplate.create_loop_variable(
                "{items}",
                "items",
                [
                    {"name": "Item A", "price": 100},
                    {"name": "Item B", "price": 200},
                ],
            )

            assert variable["placeholder"] == "{items}"
            assert variable["name"] == "items"
            assert variable["value"] == [
                {"name": "Item A", "price": 100},
                {"name": "Item B", "price": 200},
            ]
            assert variable["mimeType"] == "json"
            assert variable["usesAdvancedTemplatingEngine"] is True

        def test_create_loop_variable_with_empty_array(self):
            """Should create a loop variable with empty array"""
            variable = TurboTemplate.create_loop_variable("{products}", "products", [])

            assert variable["value"] == []
            assert variable["mimeType"] == "json"

        def test_create_loop_variable_with_primitive_array(self):
            """Should create a loop variable with primitive array"""
            variable = TurboTemplate.create_loop_variable("{tags}", "tags", ["tag1", "tag2", "tag3"])

            assert variable["value"] == ["tag1", "tag2", "tag3"]

        def test_create_loop_variable_throws_when_placeholder_missing(self):
            """Should throw error when placeholder is missing"""
            with pytest.raises(ValueError, match="placeholder is required"):
                TurboTemplate.create_loop_variable("", "items", [])

        def test_create_loop_variable_throws_when_name_missing(self):
            """Should throw error when name is missing"""
            with pytest.raises(ValueError, match="name is required"):
                TurboTemplate.create_loop_variable("{items}", "", [])

    class TestCreateConditionalVariable:
        """Test create_conditional_variable helper"""

        def test_create_conditional_variable_with_boolean_true(self):
            """Should create a conditional variable with boolean true"""
            variable = TurboTemplate.create_conditional_variable("{is_premium}", "is_premium", True)

            assert variable == {
                "placeholder": "{is_premium}",
                "name": "is_premium",
                "value": True,
                "mimeType": "json",
                "usesAdvancedTemplatingEngine": True,
            }

        def test_create_conditional_variable_with_boolean_false(self):
            """Should create a conditional variable with boolean false"""
            variable = TurboTemplate.create_conditional_variable("{show_discount}", "show_discount", False)

            assert variable["value"] is False
            assert variable["mimeType"] == "json"
            assert variable["usesAdvancedTemplatingEngine"] is True

        def test_create_conditional_variable_with_truthy_value(self):
            """Should create a conditional variable with truthy value"""
            variable = TurboTemplate.create_conditional_variable("{count}", "count", 5)

            assert variable["value"] == 5
            assert variable["mimeType"] == "json"

        def test_create_conditional_variable_throws_when_placeholder_missing(self):
            """Should throw error when placeholder is missing"""
            with pytest.raises(ValueError, match="placeholder is required"):
                TurboTemplate.create_conditional_variable("", "is_active", True)

        def test_create_conditional_variable_throws_when_name_missing(self):
            """Should throw error when name is missing"""
            with pytest.raises(ValueError, match="name is required"):
                TurboTemplate.create_conditional_variable("{is_active}", "", True)

    class TestCreateImageVariable:
        """Test create_image_variable helper"""

        def test_create_image_variable_with_url(self):
            """Should create an image variable with URL"""
            variable = TurboTemplate.create_image_variable(
                "{logo}", "logo", "https://example.com/logo.png"
            )

            assert variable == {
                "placeholder": "{logo}",
                "name": "logo",
                "value": "https://example.com/logo.png",
                "mimeType": "image",
            }

        def test_create_image_variable_with_base64(self):
            """Should create an image variable with base64"""
            base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
            variable = TurboTemplate.create_image_variable("{signature}", "signature", base64_image)

            assert variable["value"] == base64_image
            assert variable["mimeType"] == "image"

        def test_create_image_variable_throws_when_placeholder_missing(self):
            """Should throw error when placeholder is missing"""
            with pytest.raises(ValueError, match="placeholder is required"):
                TurboTemplate.create_image_variable("", "logo", "https://example.com/logo.png")

        def test_create_image_variable_throws_when_name_missing(self):
            """Should throw error when name is missing"""
            with pytest.raises(ValueError, match="name is required"):
                TurboTemplate.create_image_variable("{logo}", "", "https://example.com/logo.png")

        def test_create_image_variable_throws_when_imageurl_missing(self):
            """Should throw error when imageUrl is missing"""
            with pytest.raises(ValueError, match="image_url is required"):
                TurboTemplate.create_image_variable("{logo}", "logo", "")


class TestValidateVariable:
    """Test validate_variable function"""

    def test_validate_correct_simple_variable(self):
        """Should validate a correct simple variable"""
        result = TurboTemplate.validate_variable(
            {"placeholder": "{name}", "name": "name", "value": "Test"}
        )

        assert result["isValid"] is True
        assert result["errors"] is None

    def test_error_when_placeholder_or_name_missing(self):
        """Should return error when placeholder or name is missing"""
        result = TurboTemplate.validate_variable({"value": "Test"})

        assert result["isValid"] is False
        assert 'Variable must have both "placeholder" and "name" properties' in result["errors"]

    def test_allow_variable_without_value_and_text(self):
        """Should allow variable without value or text property"""
        result = TurboTemplate.validate_variable({"placeholder": "{name}", "name": "name"})

        assert result["isValid"] is True

    def test_warn_about_array_without_json_mimetype(self):
        """Should warn about array without json mimeType"""
        result = TurboTemplate.validate_variable(
            {"placeholder": "{items}", "name": "items", "value": [1, 2, 3]}
        )

        assert result["isValid"] is True
        assert 'Array values should use mimeType: "json"' in result["warnings"]

    def test_no_warn_about_array_with_json_mimetype(self):
        """Should not warn about array with json mimeType"""
        result = TurboTemplate.validate_variable(
            {"placeholder": "{items}", "name": "items", "value": [1, 2, 3], "mimeType": "json"}
        )

        assert result["isValid"] is True
        assert result["warnings"] is None

    def test_validate_image_variable_with_string_value(self):
        """Should validate image variable with string value"""
        result = TurboTemplate.validate_variable(
            {
                "placeholder": "{logo}",
                "name": "logo",
                "value": "https://example.com/logo.png",
                "mimeType": "image",
            }
        )

        assert result["isValid"] is True

    def test_error_for_image_variable_with_non_string_value(self):
        """Should return error for image variable with non-string value"""
        result = TurboTemplate.validate_variable(
            {"placeholder": "{logo}", "name": "logo", "value": 123, "mimeType": "image"}
        )

        assert result["isValid"] is False
        assert "Image variables must have a string value (URL or base64)" in result["errors"]

    def test_warn_about_object_without_explicit_mimetype(self):
        """Should warn about object without explicit mimeType"""
        result = TurboTemplate.validate_variable(
            {"placeholder": "{user}", "name": "user", "value": {"name": "Test"}}
        )

        assert result["isValid"] is True
        assert 'Complex objects should explicitly set mimeType to "json"' in result["warnings"]


class TestGenerate:
    """Test generate function"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboTemplate._client = None

    @pytest.mark.asyncio
    async def test_generate_document_with_simple_variables(self):
        """Should generate document with simple variables"""
        mock_response = {
            "id": "doc-123",
            "name": "Test Document",
        }

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            result = await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Test Document",
                    "description": "Test description",
                    "variables": [
                        {"placeholder": "{customer_name}", "name": "customer_name", "value": "Person A", "mimeType": "text"},
                        {"placeholder": "{order_total}", "name": "order_total", "value": 1500, "mimeType": "text"},
                    ],
                }
            )

            assert result["id"] == "doc-123"
            assert result["name"] == "Test Document"
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert call_args[0][0] == "/v1/deliverable"
            body = call_args[1]["data"]
            assert body["templateId"] == "template-123"
            assert body["name"] == "Test Document"
            assert len(body["variables"]) == 2
            assert body["variables"][0]["placeholder"] == "{customer_name}"
            assert body["variables"][0]["name"] == "customer_name"
            assert body["variables"][0]["value"] == "Person A"
            assert body["variables"][0]["mimeType"] == "text"

    @pytest.mark.asyncio
    async def test_generate_document_with_nested_object_variables(self):
        """Should generate document with nested object variables"""
        mock_response = {"id": "doc-456", "name": "Nested Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            result = await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Nested Document",
                    "description": "Document with nested objects",
                    "variables": [
                        {
                            "placeholder": "{user}",
                            "name": "user",
                            "mimeType": "json",
                            "value": {
                                "firstName": "Foo",
                                "lastName": "Bar",
                                "profile": {"company": "Company ABC"},
                            },
                            "usesAdvancedTemplatingEngine": True,
                        }
                    ],
                }
            )

            assert result["id"] == "doc-456"
            call_args = mock_client.post.call_args
            body = call_args[1]["data"]
            assert body["variables"][0]["mimeType"] == "json"
            assert body["variables"][0]["usesAdvancedTemplatingEngine"] is True

    @pytest.mark.asyncio
    async def test_generate_document_with_loop_array_variables(self):
        """Should generate document with loop/array variables"""
        mock_response = {"id": "doc-789", "name": "Loop Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            result = await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Loop Document",
                    "description": "Document with loops",
                    "variables": [
                        {
                            "placeholder": "{items}",
                            "name": "items",
                            "mimeType": "json",
                            "value": [
                                {"name": "Item A", "quantity": 5, "price": 100},
                                {"name": "Item B", "quantity": 3, "price": 200},
                            ],
                            "usesAdvancedTemplatingEngine": True,
                        }
                    ],
                }
            )

            assert result["id"] == "doc-789"
            call_args = mock_client.post.call_args
            body = call_args[1]["data"]
            assert body["variables"][0]["placeholder"] == "{items}"
            assert body["variables"][0]["mimeType"] == "json"

    @pytest.mark.asyncio
    async def test_generate_document_with_helper_created_variables(self):
        """Should generate document with helper-created variables"""
        mock_response = {"id": "doc-helper", "name": "Helper Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            result = await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Helper Document",
                    "description": "Document using helper functions",
                    "variables": [
                        TurboTemplate.create_simple_variable("{title}", "title", "Quarterly Report", "text"),
                        TurboTemplate.create_advanced_engine_variable(
                            "{company}", "company", {"name": "Company XYZ", "employees": 500}
                        ),
                        TurboTemplate.create_loop_variable(
                            "{departments}", "departments", [{"name": "Dept A"}, {"name": "Dept B"}]
                        ),
                        TurboTemplate.create_conditional_variable("{show_financials}", "show_financials", True),
                        TurboTemplate.create_image_variable("{logo}", "logo", "https://example.com/logo.png"),
                    ],
                }
            )

            assert result["id"] == "doc-helper"
            mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_includes_optional_request_parameters(self):
        """Should include optional request parameters"""
        mock_response = {"id": "doc-options", "name": "Options Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Options Document",
                    "description": "Document with all options",
                    "variables": [{"placeholder": "{test}", "name": "test", "value": "value", "mimeType": "text"}],
                    "replaceFonts": True,
                    "defaultFont": "Arial",
                    "metadata": {"customField": "value"},
                }
            )

            call_args = mock_client.post.call_args
            body = call_args[1]["data"]
            assert body["replaceFonts"] is True
            assert body["defaultFont"] == "Arial"
            # Note: outputFormat is not supported in TurboTemplate API
            assert body["metadata"] == {"customField": "value"}

    @pytest.mark.asyncio
    async def test_generate_allows_variable_with_no_value_or_text(self):
        """Should allow variable with no value or text property"""
        mock_response = {"id": "doc-no-value", "name": "No Value Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            result = await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "No Value Document",
                    "description": "Document with variable that has no value/text",
                    "variables": [{"placeholder": "{test}", "name": "test", "mimeType": "text"}],
                }
            )

            assert result["id"] == "doc-no-value"
            assert result["name"] == "No Value Document"

    @pytest.mark.asyncio
    async def test_generate_handles_text_property_as_fallback(self):
        """Should handle text property as fallback"""
        mock_response = {"id": "doc-text", "name": "Text Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Text Document",
                    "description": "Document using text property",
                    "variables": [{"placeholder": "{legacy}", "name": "legacy", "text": "Legacy value", "mimeType": "text"}],
                }
            )

            call_args = mock_client.post.call_args
            body = call_args[1]["data"]
            assert body["variables"][0]["text"] == "Legacy value"

    @pytest.mark.asyncio
    async def test_generate_allows_null_value(self):
        """Should allow variable with None/null value"""
        mock_response = {"id": "doc-null", "name": "Null Value Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            result = await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Null Value Document",
                    "description": "Document with None value",
                    "variables": [{"placeholder": "{test}", "name": "test", "value": None, "mimeType": "text"}],
                }
            )

            assert result["id"] == "doc-null"
            call_args = mock_client.post.call_args
            body = call_args[1]["data"]
            assert body["variables"][0]["value"] is None


class TestPlaceholderAndNameHandling:
    """Test placeholder and name handling"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboTemplate._client = None

    @pytest.mark.asyncio
    async def test_require_both_placeholder_and_name_in_generated_request(self):
        """Should require both placeholder and name in generated request"""
        mock_response = {"id": "doc-both", "name": "Both Fields Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Both Fields Document",
                    "description": "Document with both placeholder and name",
                    "variables": [
                        {"placeholder": "{customer}", "name": "customer", "value": "Person A", "mimeType": "text"}
                    ],
                }
            )

            call_args = mock_client.post.call_args
            body = call_args[1]["data"]
            assert body["variables"][0]["placeholder"] == "{customer}"
            assert body["variables"][0]["name"] == "customer"

    @pytest.mark.asyncio
    async def test_allow_distinct_placeholder_and_name_values(self):
        """Should allow distinct placeholder and name values"""
        mock_response = {"id": "doc-distinct", "name": "Distinct Fields Document"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Distinct Fields Document",
                    "description": "Document with distinct placeholder and name",
                    "variables": [
                        {"placeholder": "{cust_name}", "name": "customerFullName", "value": "Person A", "mimeType": "text"}
                    ],
                }
            )

            call_args = mock_client.post.call_args
            body = call_args[1]["data"]
            assert body["variables"][0]["placeholder"] == "{cust_name}"
            assert body["variables"][0]["name"] == "customerFullName"


class TestErrorHandling:
    """Test error handling"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboTemplate._client = None

    @pytest.mark.asyncio
    async def test_throw_error_when_not_configured(self):
        """Should throw error when not configured"""
        with pytest.raises(RuntimeError, match="not configured"):
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Test",
                    "description": "Test",
                    "variables": [{"placeholder": "{test}", "name": "test", "value": "value", "mimeType": "text"}],
                }
            )

    @pytest.mark.asyncio
    async def test_handle_api_errors_gracefully(self):
        """Should handle API errors gracefully"""
        api_error = Exception("Template not found")

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(side_effect=api_error)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            with pytest.raises(Exception, match="Template not found"):
                await TurboTemplate.generate(
                    {
                        "templateId": "invalid-template",
                        "name": "Error Document",
                        "description": "Document that should fail",
                        "variables": [{"placeholder": "{test}", "name": "test", "value": "value", "mimeType": "text"}],
                    }
                )


class TestDownload:
    """Test download function"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboTemplate._client = None

    @pytest.mark.asyncio
    async def test_download_deliverable_source_format(self):
        """Should download deliverable in source format by default"""
        mock_buffer = b"mock document content"

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_raw = AsyncMock(return_value=mock_buffer)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            result = await TurboTemplate.download("deliverable-123")

            assert result == mock_buffer
            mock_client.get_raw.assert_called_once_with("/v1/deliverable/file/deliverable-123")

    @pytest.mark.asyncio
    async def test_download_deliverable_pdf_format(self):
        """Should download deliverable as PDF when format is pdf"""
        mock_buffer = b"mock pdf content"

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_raw = AsyncMock(return_value=mock_buffer)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            result = await TurboTemplate.download("deliverable-456", "pdf")

            assert result == mock_buffer
            mock_client.get_raw.assert_called_once_with("/v1/deliverable/file/pdf/deliverable-456")

    @pytest.mark.asyncio
    async def test_download_throws_when_deliverable_id_empty(self):
        """Should throw error when deliverable_id is empty"""
        TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")

        with pytest.raises(ValueError, match="deliverable_id is required"):
            await TurboTemplate.download("")

    @pytest.mark.asyncio
    async def test_download_handles_errors(self):
        """Should handle download errors"""
        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.get_raw = AsyncMock(side_effect=Exception("Not found"))
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org", sender_email="test@company.com")
            with pytest.raises(Exception, match="Not found"):
                await TurboTemplate.download("invalid-id")
