"""
TurboTemplate Module Tests

Tests for advanced templating features:
- Helper functions (create_simple_variable, create_nested_variable, etc.)
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
        TurboTemplate.configure(api_key="test-api-key", org_id="test-org-id")
        assert TurboTemplate._client is not None
        assert TurboTemplate._client.api_key == "test-api-key"
        assert TurboTemplate._client.org_id == "test-org-id"

    def test_configure_with_custom_base_url(self):
        """Should configure with custom base URL"""
        TurboTemplate.configure(
            api_key="test-api-key",
            org_id="test-org-id",
            base_url="https://custom-api.example.com",
        )
        assert TurboTemplate._client.base_url == "https://custom-api.example.com"


class TestHelperFunctions:
    """Test helper functions for creating variables"""

    class TestCreateSimpleVariable:
        """Test create_simple_variable helper"""

        def test_create_simple_variable_with_string_value(self):
            """Should create a simple variable with string value"""
            variable = TurboTemplate.create_simple_variable("customer_name", "Person A")

            assert variable == {
                "placeholder": "{customer_name}",
                "name": "customer_name",
                "value": "Person A",
            }

        def test_create_simple_variable_with_number_value(self):
            """Should create a simple variable with number value"""
            variable = TurboTemplate.create_simple_variable("order_total", 1500)

            assert variable == {
                "placeholder": "{order_total}",
                "name": "order_total",
                "value": 1500,
            }

        def test_create_simple_variable_with_boolean_value(self):
            """Should create a simple variable with boolean value"""
            variable = TurboTemplate.create_simple_variable("is_active", True)

            assert variable == {
                "placeholder": "{is_active}",
                "name": "is_active",
                "value": True,
            }

        def test_create_simple_variable_with_custom_placeholder(self):
            """Should use custom placeholder when provided"""
            variable = TurboTemplate.create_simple_variable(
                "customer_name", "Person A", "{custom_placeholder}"
            )

            assert variable == {
                "placeholder": "{custom_placeholder}",
                "name": "customer_name",
                "value": "Person A",
            }

        def test_create_simple_variable_with_curly_braces_in_name(self):
            """Should handle name that already has curly braces"""
            variable = TurboTemplate.create_simple_variable("{customer_name}", "Person A")

            assert variable == {
                "placeholder": "{customer_name}",
                "name": "{customer_name}",
                "value": "Person A",
            }

    class TestCreateNestedVariable:
        """Test create_nested_variable helper"""

        def test_create_nested_variable_with_object_value(self):
            """Should create a nested variable with object value"""
            variable = TurboTemplate.create_nested_variable(
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

        def test_create_nested_variable_with_deeply_nested_object(self):
            """Should create a nested variable with deeply nested object"""
            variable = TurboTemplate.create_nested_variable(
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

        def test_create_nested_variable_with_custom_placeholder(self):
            """Should use custom placeholder when provided"""
            variable = TurboTemplate.create_nested_variable(
                "user", {"name": "Test"}, "{custom_user}"
            )

            assert variable["placeholder"] == "{custom_user}"
            assert variable["name"] == "user"

    class TestCreateLoopVariable:
        """Test create_loop_variable helper"""

        def test_create_loop_variable_with_array_value(self):
            """Should create a loop variable with array value"""
            variable = TurboTemplate.create_loop_variable(
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
            variable = TurboTemplate.create_loop_variable("products", [])

            assert variable["value"] == []
            assert variable["mimeType"] == "json"

        def test_create_loop_variable_with_primitive_array(self):
            """Should create a loop variable with primitive array"""
            variable = TurboTemplate.create_loop_variable("tags", ["tag1", "tag2", "tag3"])

            assert variable["value"] == ["tag1", "tag2", "tag3"]

        def test_create_loop_variable_with_custom_placeholder(self):
            """Should use custom placeholder when provided"""
            variable = TurboTemplate.create_loop_variable("items", [], "{line_items}")

            assert variable["placeholder"] == "{line_items}"
            assert variable["name"] == "items"

    class TestCreateConditionalVariable:
        """Test create_conditional_variable helper"""

        def test_create_conditional_variable_with_boolean_true(self):
            """Should create a conditional variable with boolean true"""
            variable = TurboTemplate.create_conditional_variable("is_premium", True)

            assert variable == {
                "placeholder": "{is_premium}",
                "name": "is_premium",
                "value": True,
                "usesAdvancedTemplatingEngine": True,
            }

        def test_create_conditional_variable_with_boolean_false(self):
            """Should create a conditional variable with boolean false"""
            variable = TurboTemplate.create_conditional_variable("show_discount", False)

            assert variable["value"] is False
            assert variable["usesAdvancedTemplatingEngine"] is True

        def test_create_conditional_variable_with_truthy_value(self):
            """Should create a conditional variable with truthy value"""
            variable = TurboTemplate.create_conditional_variable("count", 5)

            assert variable["value"] == 5

        def test_create_conditional_variable_with_custom_placeholder(self):
            """Should use custom placeholder when provided"""
            variable = TurboTemplate.create_conditional_variable(
                "is_active", True, "{active_flag}"
            )

            assert variable["placeholder"] == "{active_flag}"
            assert variable["name"] == "is_active"

    class TestCreateImageVariable:
        """Test create_image_variable helper"""

        def test_create_image_variable_with_url(self):
            """Should create an image variable with URL"""
            variable = TurboTemplate.create_image_variable(
                "logo", "https://example.com/logo.png"
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
            variable = TurboTemplate.create_image_variable("signature", base64_image)

            assert variable["value"] == base64_image
            assert variable["mimeType"] == "image"

        def test_create_image_variable_with_custom_placeholder(self):
            """Should use custom placeholder when provided"""
            variable = TurboTemplate.create_image_variable(
                "logo", "https://example.com/logo.png", "{company_logo}"
            )

            assert variable["placeholder"] == "{company_logo}"
            assert variable["name"] == "logo"


class TestValidateVariable:
    """Test validate_variable function"""

    def test_validate_correct_simple_variable(self):
        """Should validate a correct simple variable"""
        result = TurboTemplate.validate_variable(
            {"placeholder": "{name}", "name": "name", "value": "Test"}
        )

        assert result["isValid"] is True
        assert result["errors"] is None

    def test_error_when_placeholder_and_name_missing(self):
        """Should return error when placeholder and name are both missing"""
        result = TurboTemplate.validate_variable({"value": "Test"})

        assert result["isValid"] is False
        assert 'Variable must have either "placeholder" or "name" property' in result["errors"]

    def test_error_when_value_and_text_missing(self):
        """Should return error when value and text are both missing"""
        result = TurboTemplate.validate_variable({"placeholder": "{name}", "name": "name"})

        assert result["isValid"] is False
        assert 'Variable must have either "value" or "text" property' in result["errors"]

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
            "success": True,
            "deliverableId": "doc-123",
            "message": "Document generated successfully",
        }

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
            result = await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Test Document",
                    "description": "Test description",
                    "variables": [
                        {"placeholder": "{customer_name}", "name": "customer_name", "value": "Person A"},
                        {"placeholder": "{order_total}", "name": "order_total", "value": 1500},
                    ],
                }
            )

            assert result["success"] is True
            assert result["deliverableId"] == "doc-123"
            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert call_args[0][0] == "/v1/deliverable"
            body = call_args[1]["json"]
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
        mock_response = {"success": True, "deliverableId": "doc-456"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
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

            assert result["success"] is True
            call_args = mock_client.post.call_args
            body = call_args[1]["json"]
            assert body["variables"][0]["mimeType"] == "json"
            assert body["variables"][0]["usesAdvancedTemplatingEngine"] is True

    @pytest.mark.asyncio
    async def test_generate_document_with_loop_array_variables(self):
        """Should generate document with loop/array variables"""
        mock_response = {"success": True, "deliverableId": "doc-789"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
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

            assert result["success"] is True
            call_args = mock_client.post.call_args
            body = call_args[1]["json"]
            assert body["variables"][0]["placeholder"] == "{items}"
            assert body["variables"][0]["mimeType"] == "json"

    @pytest.mark.asyncio
    async def test_generate_document_with_helper_created_variables(self):
        """Should generate document with helper-created variables"""
        mock_response = {"success": True, "deliverableId": "doc-helper"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
            result = await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Helper Document",
                    "description": "Document using helper functions",
                    "variables": [
                        TurboTemplate.create_simple_variable("title", "Quarterly Report"),
                        TurboTemplate.create_nested_variable(
                            "company", {"name": "Company XYZ", "employees": 500}
                        ),
                        TurboTemplate.create_loop_variable(
                            "departments", [{"name": "Dept A"}, {"name": "Dept B"}]
                        ),
                        TurboTemplate.create_conditional_variable("show_financials", True),
                        TurboTemplate.create_image_variable("logo", "https://example.com/logo.png"),
                    ],
                }
            )

            assert result["success"] is True
            mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_includes_optional_request_parameters(self):
        """Should include optional request parameters"""
        mock_response = {"success": True, "deliverableId": "doc-options"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Options Document",
                    "description": "Document with all options",
                    "variables": [{"placeholder": "{test}", "name": "test", "value": "value"}],
                    "replaceFonts": True,
                    "defaultFont": "Arial",
                    "outputFormat": "pdf",
                    "metadata": {"customField": "value"},
                }
            )

            call_args = mock_client.post.call_args
            body = call_args[1]["json"]
            assert body["replaceFonts"] is True
            assert body["defaultFont"] == "Arial"
            assert body["outputFormat"] == "pdf"
            assert body["metadata"] == {"customField": "value"}

    @pytest.mark.asyncio
    async def test_generate_throws_error_when_variable_has_no_value_or_text(self):
        """Should throw error when variable has no value or text"""
        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
            with pytest.raises(ValueError, match='must have either "value" or "text" property'):
                await TurboTemplate.generate(
                    {
                        "templateId": "template-123",
                        "name": "Error Document",
                        "description": "Document that should fail",
                        "variables": [{"placeholder": "{test}", "name": "test"}],
                    }
                )

    @pytest.mark.asyncio
    async def test_generate_handles_text_property_as_fallback(self):
        """Should handle text property as fallback"""
        mock_response = {"success": True, "deliverableId": "doc-text"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Text Document",
                    "description": "Document using text property",
                    "variables": [{"placeholder": "{legacy}", "name": "legacy", "text": "Legacy value"}],
                }
            )

            call_args = mock_client.post.call_args
            body = call_args[1]["json"]
            assert body["variables"][0]["text"] == "Legacy value"


class TestPlaceholderAndNameHandling:
    """Test placeholder and name handling"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboTemplate._client = None

    @pytest.mark.asyncio
    async def test_require_both_placeholder_and_name_in_generated_request(self):
        """Should require both placeholder and name in generated request"""
        mock_response = {"success": True, "deliverableId": "doc-both"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Both Fields Document",
                    "description": "Document with both placeholder and name",
                    "variables": [
                        {"placeholder": "{customer}", "name": "customer", "value": "Person A"}
                    ],
                }
            )

            call_args = mock_client.post.call_args
            body = call_args[1]["json"]
            assert body["variables"][0]["placeholder"] == "{customer}"
            assert body["variables"][0]["name"] == "customer"

    @pytest.mark.asyncio
    async def test_allow_distinct_placeholder_and_name_values(self):
        """Should allow distinct placeholder and name values"""
        mock_response = {"success": True, "deliverableId": "doc-distinct"}

        with patch.object(TurboTemplate, "_get_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_get_client.return_value = mock_client

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
            await TurboTemplate.generate(
                {
                    "templateId": "template-123",
                    "name": "Distinct Fields Document",
                    "description": "Document with distinct placeholder and name",
                    "variables": [
                        {"placeholder": "{cust_name}", "name": "customerFullName", "value": "Person A"}
                    ],
                }
            )

            call_args = mock_client.post.call_args
            body = call_args[1]["json"]
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
                    "variables": [{"placeholder": "{test}", "name": "test", "value": "value"}],
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

            TurboTemplate.configure(api_key="test-key", org_id="test-org")
            with pytest.raises(Exception, match="Template not found"):
                await TurboTemplate.generate(
                    {
                        "templateId": "invalid-template",
                        "name": "Error Document",
                        "description": "Document that should fail",
                        "variables": [{"placeholder": "{test}", "name": "test", "value": "value"}],
                    }
                )
