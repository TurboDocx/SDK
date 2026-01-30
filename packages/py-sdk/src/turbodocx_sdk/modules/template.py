"""
TurboTemplate Module - Advanced document templating with Angular-like expressions

Provides template generation operations:
- generate: Generate document from template with variables
- validate_variable: Validate variable configuration
- Helper functions for creating common variable types
"""

from typing import Any, Dict, List, Optional, Union

from ..http import HttpClient
from ..types.template import (
    TemplateVariable,
    GenerateTemplateRequest,
    GenerateTemplateResponse,
    VariableValidation,
    VariableMimeType,
)


class TurboTemplate:
    """TurboTemplate module for advanced document templating"""

    _client: Optional[HttpClient] = None

    @classmethod
    def configure(
        cls,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        base_url: str = "https://api.turbodocx.com",
        org_id: Optional[str] = None,
        sender_email: Optional[str] = None,
        sender_name: Optional[str] = None,
    ) -> None:
        """
        Configure the TurboTemplate module with API credentials

        Args:
            api_key: TurboDocx API key (required)
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API (optional, defaults to https://api.turbodocx.com)
            org_id: Organization ID (required)
            sender_email: Reply-to email address for signature requests (optional for template generation).
            sender_name: Sender name for signature requests (optional for template generation).

        Example:
            >>> TurboTemplate.configure(
            ...     api_key=os.environ.get("TURBODOCX_API_KEY"),
            ...     org_id=os.environ.get("TURBODOCX_ORG_ID")
            ... )
        """
        cls._client = HttpClient(
            api_key=api_key,
            access_token=access_token,
            base_url=base_url,
            org_id=org_id,
            sender_email=sender_email,
            sender_name=sender_name,
        )

    @classmethod
    def _get_client(cls) -> HttpClient:
        """Get the HTTP client instance, raising error if not configured"""
        if cls._client is None:
            raise RuntimeError(
                "TurboTemplate not configured. Call TurboTemplate.configure(api_key='...', org_id='...') first."
            )
        return cls._client

    @classmethod
    async def generate(cls, request: GenerateTemplateRequest) -> GenerateTemplateResponse:
        """
        Generate a document from a template with variables

        Supports advanced templating features:
        - Simple variable substitution: {customer_name}
        - Nested objects: {user.firstName}
        - Loops: {#products}...{/products}
        - Conditionals: {#if condition}...{/if}
        - Expressions: {price + tax}

        Args:
            request: Template ID and variables

        Returns:
            Generated document response

        Example:
            >>> # Simple variable substitution
            >>> result = await TurboTemplate.generate({
            ...     "templateId": "template-uuid",
            ...     "variables": [
            ...         {"placeholder": "{customer_name}", "mimeType": "text", "value": "John Doe"},
            ...         {"placeholder": "{order_total}", "mimeType": "text", "value": 1500}
            ...     ]
            ... })

            >>> # Advanced: nested objects with dot notation
            >>> result = await TurboTemplate.generate({
            ...     "templateId": "template-uuid",
            ...     "variables": [
            ...         {
            ...             "placeholder": "{user}",
            ...             "mimeType": "json",
            ...             "value": {
            ...                 "firstName": "John",
            ...                 "email": "john@example.com"
            ...             }
            ...         }
            ...     ]
            ... })
            >>> # Template can use: {user.firstName}, {user.email}

            >>> # Advanced: loops with arrays
            >>> result = await TurboTemplate.generate({
            ...     "templateId": "template-uuid",
            ...     "variables": [
            ...         {
            ...             "placeholder": "{products}",
            ...             "mimeType": "json",
            ...             "value": [
            ...                 {"name": "Laptop", "price": 999},
            ...                 {"name": "Mouse", "price": 29}
            ...             ]
            ...         }
            ...     ]
            ... })
            >>> # Template can use: {#products}{name}: ${price}{/products}

            >>> # Advanced: expressions with calculations
            >>> result = await TurboTemplate.generate({
            ...     "templateId": "template-uuid",
            ...     "variables": [
            ...         {"placeholder": "{price}", "mimeType": "text", "value": "100", "usesAdvancedTemplatingEngine": True},
            ...         {"placeholder": "{tax}", "mimeType": "text", "value": "15", "usesAdvancedTemplatingEngine": True}
            ...     ]
            ... })
            >>> # Template can use: {price + tax}, {price * 1.15}
        """
        client = cls._get_client()

        # Prepare request body
        body: Dict[str, Any] = {
            "templateId": request["templateId"],
            "variables": [],
        }

        # Process variables
        for v in request["variables"]:
            variable: Dict[str, Any] = {
                "placeholder": v.get("placeholder"),
                "name": v.get("name"),
            }

            # mimeType is required
            if "mimeType" not in v or not v["mimeType"]:
                raise ValueError(
                    f'Variable "{variable["placeholder"]}" must have a "mimeType" property'
                )
            variable["mimeType"] = v["mimeType"]

            # Handle value - keep objects/arrays as-is for JSON serialization
            # Allow null/None values, don't require either property
            if "value" in v:
                variable["value"] = v["value"]
            if "text" in v:
                variable["text"] = v["text"]

            # Add advanced templating flags if specified
            if "usesAdvancedTemplatingEngine" in v:
                variable["usesAdvancedTemplatingEngine"] = v["usesAdvancedTemplatingEngine"]
            if "nestedInAdvancedTemplatingEngine" in v:
                variable["nestedInAdvancedTemplatingEngine"] = v["nestedInAdvancedTemplatingEngine"]
            if "allowRichTextInjection" in v:
                variable["allowRichTextInjection"] = v["allowRichTextInjection"]

            # Add optional fields
            if "description" in v:
                variable["description"] = v["description"]
            if "defaultValue" in v:
                variable["defaultValue"] = v["defaultValue"]
            if "subvariables" in v:
                variable["subvariables"] = v["subvariables"]

            body["variables"].append(variable)

        # Add optional request parameters
        if "name" in request:
            body["name"] = request["name"]
        if "description" in request:
            body["description"] = request["description"]
        if "replaceFonts" in request:
            body["replaceFonts"] = request["replaceFonts"]
        if "defaultFont" in request:
            body["defaultFont"] = request["defaultFont"]
        # Note: outputFormat is not supported in TurboTemplate API
        if "metadata" in request:
            body["metadata"] = request["metadata"]

        response = await client.post("/v1/deliverable", json=body)
        return response

    @classmethod
    def validate_variable(cls, variable: TemplateVariable) -> VariableValidation:
        """
        Validate a variable configuration

        Checks if a variable is properly configured for advanced templating

        Args:
            variable: Variable to validate

        Returns:
            Validation result with isValid flag and any errors/warnings
        """
        errors: List[str] = []
        warnings: List[str] = []

        # Check placeholder/name
        if not variable.get("placeholder") or not variable.get("name"):
            errors.append('Variable must have both "placeholder" and "name" properties')

        # Check value/text - allow None values, don't enforce either property

        # Check advanced templating settings
        mime_type = variable.get("mimeType")
        value = variable.get("value")

        if mime_type == "json" or (isinstance(value, (dict, list)) and value is not None):
            if not mime_type:
                warnings.append('Complex objects should explicitly set mimeType to "json"')

        # Check for arrays
        if isinstance(value, list):
            if mime_type != "json":
                warnings.append('Array values should use mimeType: "json"')

        # Check image variables
        if mime_type == "image":
            if not isinstance(value, str):
                errors.append("Image variables must have a string value (URL or base64)")

        return {
            "isValid": len(errors) == 0,
            "errors": errors if errors else None,
            "warnings": warnings if warnings else None,
        }

    @staticmethod
    def create_simple_variable(
        placeholder: str,
        name: str,
        value: Union[str, int, float, bool],
        mime_type: str,
    ) -> TemplateVariable:
        """
        Helper: Create a simple text variable

        Args:
            placeholder: Variable placeholder (e.g., '{customer_name}')
            name: Variable name
            value: Variable value
            mime_type: Variable mime type ('text' or 'html')

        Returns:
            TemplateVariable configured for simple substitution

        Raises:
            ValueError: If any required parameter is missing or invalid
        """
        if not placeholder:
            raise ValueError("placeholder is required")
        if not name:
            raise ValueError("name is required")
        if not mime_type:
            raise ValueError("mime_type is required")
        if mime_type not in (VariableMimeType.TEXT, VariableMimeType.HTML):
            raise ValueError("mime_type must be 'text' or 'html'")
        return {"placeholder": placeholder, "name": name, "value": value, "mimeType": mime_type}

    @staticmethod
    def create_advanced_engine_variable(
        placeholder: str,
        name: str,
        value: Dict[str, Any],
    ) -> TemplateVariable:
        """
        Helper: Create an advanced engine variable (for nested objects, complex data)

        Args:
            placeholder: Variable placeholder (e.g., '{user}')
            name: Variable name
            value: Nested object/dict value

        Returns:
            TemplateVariable configured for advanced templating engine

        Raises:
            ValueError: If any required parameter is missing
        """
        if not placeholder:
            raise ValueError("placeholder is required")
        if not name:
            raise ValueError("name is required")
        return {
            "placeholder": placeholder,
            "name": name,
            "value": value,
            "usesAdvancedTemplatingEngine": True,
            "mimeType": VariableMimeType.JSON,
        }

    @staticmethod
    def create_loop_variable(
        placeholder: str,
        name: str,
        value: List[Any],
    ) -> TemplateVariable:
        """
        Helper: Create a loop/array variable

        Args:
            placeholder: Variable placeholder (e.g., '{products}')
            name: Variable name
            value: Array/list value for iteration

        Returns:
            TemplateVariable configured for loop iteration

        Raises:
            ValueError: If any required parameter is missing
        """
        if not placeholder:
            raise ValueError("placeholder is required")
        if not name:
            raise ValueError("name is required")
        return {
            "placeholder": placeholder,
            "name": name,
            "value": value,
            "usesAdvancedTemplatingEngine": True,
            "mimeType": VariableMimeType.JSON,
        }

    @staticmethod
    def create_conditional_variable(
        placeholder: str,
        name: str,
        value: Any,
    ) -> TemplateVariable:
        """
        Helper: Create a conditional variable

        Args:
            placeholder: Variable placeholder (e.g., '{showDetails}')
            name: Variable name
            value: Variable value (typically boolean)

        Returns:
            TemplateVariable configured for conditionals

        Raises:
            ValueError: If any required parameter is missing
        """
        if not placeholder:
            raise ValueError("placeholder is required")
        if not name:
            raise ValueError("name is required")
        return {
            "placeholder": placeholder,
            "name": name,
            "value": value,
            "mimeType": VariableMimeType.JSON,
            "usesAdvancedTemplatingEngine": True,
        }

    @staticmethod
    def create_image_variable(
        placeholder: str,
        name: str,
        image_url: str,
    ) -> TemplateVariable:
        """
        Helper: Create an image variable

        Args:
            placeholder: Variable placeholder (e.g., '{logo}')
            name: Variable name
            image_url: Image URL or base64 data

        Returns:
            TemplateVariable configured for image insertion

        Raises:
            ValueError: If any required parameter is missing
        """
        if not placeholder:
            raise ValueError("placeholder is required")
        if not name:
            raise ValueError("name is required")
        if not image_url:
            raise ValueError("image_url is required")
        return {
            "placeholder": placeholder,
            "name": name,
            "value": image_url,
            "mimeType": VariableMimeType.IMAGE,
        }
