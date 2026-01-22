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
    ) -> None:
        """
        Configure the TurboTemplate module with API credentials

        Args:
            api_key: TurboDocx API key (required)
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API (optional, defaults to https://api.turbodocx.com)
            org_id: Organization ID (required)

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
        - Filters: {name | uppercase}

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
            if "value" in v and v["value"] is not None:
                variable["value"] = v["value"]
            elif "text" in v and v["text"] is not None:
                variable["text"] = v["text"]
            else:
                raise ValueError(
                    f'Variable "{variable["placeholder"]}" must have either "value" or "text" property'
                )

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
        if "outputFormat" in request:
            body["outputFormat"] = request["outputFormat"]
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
        if not variable.get("placeholder") and not variable.get("name"):
            errors.append('Variable must have either "placeholder" or "name" property')

        # Check value/text
        has_value = "value" in variable and variable["value"] is not None
        has_text = "text" in variable and variable["text"] is not None

        if not has_value and not has_text:
            errors.append('Variable must have either "value" or "text" property')

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
        name: str, value: Union[str, int, float, bool], placeholder: Optional[str] = None
    ) -> TemplateVariable:
        """
        Helper: Create a simple text variable

        Args:
            name: Variable name
            value: Variable value
            placeholder: Optional custom placeholder (defaults to {name})

        Returns:
            TemplateVariable configured for simple substitution
        """
        p = placeholder if placeholder else (name if name.startswith("{") else f"{{{name}}}")
        return {"placeholder": p, "name": name, "value": value, "mimeType": VariableMimeType.TEXT}

    @staticmethod
    def create_advanced_engine_variable(
        name: str, value: Dict[str, Any], placeholder: Optional[str] = None
    ) -> TemplateVariable:
        """
        Helper: Create an advanced engine variable (for nested objects, complex data)

        Args:
            name: Variable name
            value: Nested object/dict value
            placeholder: Optional custom placeholder (defaults to {name})

        Returns:
            TemplateVariable configured for advanced templating engine
        """
        p = placeholder if placeholder else (name if name.startswith("{") else f"{{{name}}}")
        return {
            "placeholder": p,
            "name": name,
            "value": value,
            "usesAdvancedTemplatingEngine": True,
            "mimeType": VariableMimeType.JSON,
        }

    @staticmethod
    def create_loop_variable(
        name: str, value: List[Any], placeholder: Optional[str] = None
    ) -> TemplateVariable:
        """
        Helper: Create a loop/array variable

        Args:
            name: Variable name
            value: Array/list value for iteration
            placeholder: Optional custom placeholder (defaults to {name})

        Returns:
            TemplateVariable configured for loop iteration
        """
        p = placeholder if placeholder else (name if name.startswith("{") else f"{{{name}}}")
        return {
            "placeholder": p,
            "name": name,
            "value": value,
            "usesAdvancedTemplatingEngine": True,
            "mimeType": VariableMimeType.JSON,
        }

    @staticmethod
    def create_conditional_variable(
        name: str, value: Any, placeholder: Optional[str] = None
    ) -> TemplateVariable:
        """
        Helper: Create a conditional variable

        Args:
            name: Variable name
            value: Variable value (typically boolean)
            placeholder: Optional custom placeholder (defaults to {name})

        Returns:
            TemplateVariable configured for conditionals
        """
        p = placeholder if placeholder else (name if name.startswith("{") else f"{{{name}}}")
        return {
            "placeholder": p,
            "name": name,
            "value": value,
            "mimeType": VariableMimeType.JSON,
            "usesAdvancedTemplatingEngine": True,
        }

    @staticmethod
    def create_image_variable(
        name: str, image_url: str, placeholder: Optional[str] = None
    ) -> TemplateVariable:
        """
        Helper: Create an image variable

        Args:
            name: Variable name
            image_url: Image URL or base64 data
            placeholder: Optional custom placeholder (defaults to {name})

        Returns:
            TemplateVariable configured for image insertion
        """
        p = placeholder if placeholder else (name if name.startswith("{") else f"{{{name}}}")
        return {
            "placeholder": p,
            "name": name,
            "value": image_url,
            "mimeType": VariableMimeType.IMAGE,
        }
