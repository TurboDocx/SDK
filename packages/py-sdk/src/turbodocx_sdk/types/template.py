"""
Type definitions for TurboTemplate module - Advanced templating
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Union, TypedDict


class VariableMimeType(str, Enum):
    """Variable MIME types supported by TurboDocx"""

    TEXT = "text"
    HTML = "html"
    IMAGE = "image"
    MARKDOWN = "markdown"
    JSON = "json"


class _TemplateVariableRequired(TypedDict):
    """Required fields for TemplateVariable"""

    placeholder: str
    name: str


class TemplateVariable(_TemplateVariableRequired, total=False):
    """
    Variable configuration for template generation

    Supports both simple text replacement and advanced templating with Angular-like expressions

    Attributes:
        placeholder: Variable placeholder in template (required, e.g., "{customer_name}")
        name: Variable name (required, can be different from placeholder)
        value: Variable value - can be string, number, boolean, dict, list, or None
        text: Text value (legacy, prefer using 'value')
        mimeType: MIME type of the variable
        usesAdvancedTemplatingEngine: Enable advanced templating for this variable
        nestedInAdvancedTemplatingEngine: Marks variable as nested within advanced context
        allowRichTextInjection: Allow rich text injection (HTML formatting)
        description: Variable description
        defaultValue: Whether this is a default value
        nestedVariables: Nested variables for complex structures
        subvariables: Sub-variables (legacy structure)
    """

    value: Union[str, int, float, bool, Dict[str, Any], List[Any], None]
    text: Optional[str]
    mimeType: Optional[VariableMimeType]
    usesAdvancedTemplatingEngine: Optional[bool]
    nestedInAdvancedTemplatingEngine: Optional[bool]
    allowRichTextInjection: Optional[bool]
    description: Optional[str]
    defaultValue: Optional[bool]
    nestedVariables: Optional[List["TemplateVariable"]]
    subvariables: Optional[List["TemplateVariable"]]


class GenerateTemplateRequest(TypedDict, total=False):
    """
    Request for generating a document from template

    Attributes:
        templateId: Template ID to use for generation
        variables: Variables to inject into the template
        name: Document name
        description: Document description
        replaceFonts: Replace fonts in the document
        defaultFont: Default font to use when replacing
        outputFormat: Output format (default: docx)
        metadata: Additional metadata
    """

    templateId: str
    variables: List[TemplateVariable]
    name: Optional[str]
    description: Optional[str]
    replaceFonts: Optional[bool]
    defaultFont: Optional[str]
    outputFormat: Optional[str]  # 'docx' or 'pdf'
    metadata: Optional[Dict[str, Any]]


class GenerateTemplateResponse(TypedDict, total=False):
    """
    Response from template generation

    Attributes:
        success: Whether generation was successful
        deliverableId: Deliverable ID
        buffer: Generated document buffer (if returnBuffer is true)
        downloadUrl: Document download URL
        message: Response message
        error: Error details if generation failed
    """

    success: bool
    deliverableId: Optional[str]
    buffer: Optional[bytes]
    downloadUrl: Optional[str]
    message: Optional[str]
    error: Optional[str]


class VariableValidation(TypedDict, total=False):
    """
    Variable validation result

    Attributes:
        isValid: Whether the variable is valid
        errors: Validation errors
        warnings: Validation warnings
    """

    isValid: bool
    errors: Optional[List[str]]
    warnings: Optional[List[str]]


# Helper type aliases for common patterns
SimpleVariable = TemplateVariable
NestedVariable = TemplateVariable
LoopVariable = TemplateVariable
ConditionalVariable = TemplateVariable
ImageVariable = TemplateVariable
