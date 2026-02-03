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
    mimeType: str  # Required: 'text', 'json', 'html', 'image', 'markdown'


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
        subvariables: Sub-variables (legacy structure)
    """

    value: Union[str, int, float, bool, Dict[str, Any], List[Any], None]
    text: Optional[str]
    usesAdvancedTemplatingEngine: Optional[bool]
    nestedInAdvancedTemplatingEngine: Optional[bool]
    allowRichTextInjection: Optional[bool]
    description: Optional[str]
    defaultValue: Optional[bool]
    subvariables: Optional[List["TemplateVariable"]]


class _GenerateTemplateRequestRequired(TypedDict):
    """Required fields for GenerateTemplateRequest"""

    templateId: str
    variables: List[TemplateVariable]
    name: str  # Document name is required


class GenerateTemplateRequest(_GenerateTemplateRequestRequired, total=False):
    """
    Request for generating a document from template

    Attributes:
        templateId: Template ID to use for generation (required)
        variables: Variables to inject into the template (required)
        name: Document name (required)
        description: Document description (optional)
        replaceFonts: Replace fonts in the document (optional)
        defaultFont: Default font to use when replacing (optional)
        outputFormat: Output format (default: docx) (optional)
        metadata: Additional metadata (optional)
    """

    description: Optional[str]
    replaceFonts: Optional[bool]
    defaultFont: Optional[str]
    outputFormat: Optional[str]  # 'docx' or 'pdf'
    metadata: Optional[Dict[str, Any]]


class GenerateTemplateResponse(TypedDict, total=False):
    """
    Response from template generation

    Contains the full deliverable information returned by the API.

    Attributes:
        id: Deliverable ID
        name: Document name
        description: Document description
        templateId: Template ID used for generation
        projectspaceId: Projectspace ID
        deliverableFolderId: Folder ID for the deliverable
        metadata: Additional metadata
        createdBy: User who created the deliverable
        orgId: Organization ID
        defaultFont: Default font used
        createdOn: Creation timestamp
        updatedOn: Last update timestamp
        isActive: Active status flag
        fonts: Font information
        downloadUrl: Document download URL
        message: Response message
        error: Error details if generation failed
        buffer: Generated document buffer (if returnBuffer is true)
    """

    # Core deliverable fields
    id: Optional[str]
    name: Optional[str]
    description: Optional[str]
    templateId: Optional[str]
    projectspaceId: Optional[str]
    deliverableFolderId: Optional[str]
    metadata: Optional[Dict[str, Any]]
    createdBy: Optional[str]
    orgId: Optional[str]
    defaultFont: Optional[str]
    createdOn: Optional[str]
    updatedOn: Optional[str]
    isActive: Optional[int]
    fonts: Optional[Any]

    # Response fields
    downloadUrl: Optional[str]
    message: Optional[str]
    error: Optional[str]
    buffer: Optional[bytes]


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
