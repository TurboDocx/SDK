package turbodocx

import (
	"context"
	"fmt"
)

// VariableMimeType represents the MIME type of a template variable
type VariableMimeType string

const (
	// MimeTypeText represents plain text
	MimeTypeText VariableMimeType = "text"
	// MimeTypeHTML represents HTML formatted content
	MimeTypeHTML VariableMimeType = "html"
	// MimeTypeImage represents an image (URL or base64)
	MimeTypeImage VariableMimeType = "image"
	// MimeTypeMarkdown represents Markdown formatted content
	MimeTypeMarkdown VariableMimeType = "markdown"
	// MimeTypeJSON represents JSON data (objects/arrays)
	MimeTypeJSON VariableMimeType = "json"
)

// DeliverableDownloadFormat represents the format for downloading deliverables
type DeliverableDownloadFormat string

const (
	// DownloadFormatSource downloads the original format (DOCX/PPTX)
	DownloadFormatSource DeliverableDownloadFormat = "source"
	// DownloadFormatPDF downloads as PDF
	DownloadFormatPDF DeliverableDownloadFormat = "pdf"
)

// TemplateVariable represents a variable to inject into a template
type TemplateVariable struct {
	// Placeholder is the variable placeholder in template (e.g., "{customer_name}", "{order_total}")
	Placeholder string `json:"placeholder"`

	// Name is the variable name (required, can be different from placeholder)
	Name string `json:"name"`

	// Value can be any type: string, number, boolean, object, array
	Value interface{} `json:"value,omitempty"`

	// Text is the text value (legacy, prefer using Value)
	Text *string `json:"text,omitempty"`

	// MimeType is the MIME type of the variable (required)
	MimeType VariableMimeType `json:"mimeType"`

	// UsesAdvancedTemplatingEngine enables advanced templating for this variable
	UsesAdvancedTemplatingEngine *bool `json:"usesAdvancedTemplatingEngine,omitempty"`

	// NestedInAdvancedTemplatingEngine marks variable as nested within advanced context
	NestedInAdvancedTemplatingEngine *bool `json:"nestedInAdvancedTemplatingEngine,omitempty"`

	// AllowRichTextInjection allows rich text injection (HTML formatting)
	AllowRichTextInjection *bool `json:"allowRichTextInjection,omitempty"`

	// Description is the variable description
	Description *string `json:"description,omitempty"`

	// DefaultValue indicates whether this is a default value
	DefaultValue *bool `json:"defaultValue,omitempty"`

	// Subvariables are sub-variables (legacy structure)
	Subvariables []TemplateVariable `json:"subvariables,omitempty"`
}

// GenerateTemplateRequest is the request for generating a document from template
type GenerateTemplateRequest struct {
	// TemplateID is the template ID to use for generation (required)
	TemplateID string `json:"templateId"`

	// Variables to inject into the template (required)
	Variables []TemplateVariable `json:"variables"`

	// Name is the document name (required)
	Name string `json:"name"`

	// Description is the document description (optional)
	Description *string `json:"description,omitempty"`

	// ReplaceFonts replaces fonts in the document (optional)
	ReplaceFonts *bool `json:"replaceFonts,omitempty"`

	// DefaultFont is the default font to use when replacing (optional)
	DefaultFont *string `json:"defaultFont,omitempty"`

	// Note: OutputFormat is not supported in TurboTemplate API

	// Metadata is additional metadata (optional)
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// GenerateTemplateResponse is the response from template generation
type GenerateTemplateResponse struct {
	// ID is the deliverable ID
	ID *string `json:"id,omitempty"`

	// Name is the document name
	Name *string `json:"name,omitempty"`

	// Description is the document description
	Description *string `json:"description,omitempty"`

	// TemplateID is the template ID used
	TemplateID *string `json:"templateId,omitempty"`

	// ProjectspaceID is the projectspace ID
	ProjectspaceID *string `json:"projectspaceId,omitempty"`

	// DeliverableFolderID is the folder ID
	DeliverableFolderID *string `json:"deliverableFolderId,omitempty"`

	// Metadata contains additional metadata
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// CreatedBy is the user who created the deliverable
	CreatedBy *string `json:"createdBy,omitempty"`

	// OrgID is the organization ID
	OrgID *string `json:"orgId,omitempty"`

	// DefaultFont is the default font used
	DefaultFont *string `json:"defaultFont,omitempty"`

	// CreatedOn is the creation timestamp
	CreatedOn *string `json:"createdOn,omitempty"`

	// UpdatedOn is the last update timestamp
	UpdatedOn *string `json:"updatedOn,omitempty"`

	// IsActive indicates if the deliverable is active
	IsActive *int `json:"isActive,omitempty"`

	// Fonts contains font information
	Fonts interface{} `json:"fonts,omitempty"`

	// Buffer is the generated document buffer (if returnBuffer is true)
	Buffer []byte `json:"buffer,omitempty"`

	// DownloadURL is the document download URL
	DownloadURL *string `json:"downloadUrl,omitempty"`

	// Message is the response message
	Message *string `json:"message,omitempty"`

	// Error contains error details if generation failed
	Error *string `json:"error,omitempty"`
}

// TurboTemplateClient provides template generation operations
type TurboTemplateClient struct {
	httpClient *HTTPClient
}

// Generate generates a document from a template with variables
//
// Supports advanced templating features:
//   - Simple variable substitution: {customer_name}
//   - Nested objects: {user.firstName}
//   - Loops: {#products}...{/products}
//   - Conditionals: {#if condition}...{/if}
//   - Expressions: {price + tax}
//
// Example:
//
//	// Simple variable substitution
//	result, err := client.TurboTemplate.Generate(ctx, &GenerateTemplateRequest{
//		TemplateID: "template-uuid",
//		Variables: []TemplateVariable{
//			{Placeholder: "{customer_name}", Value: "John Doe"},
//			{Placeholder: "{order_total}", Value: 1500},
//		},
//	})
//
//	// Advanced: nested objects with dot notation
//	mimeTypeJSON := MimeTypeJSON
//	result, err := client.TurboTemplate.Generate(ctx, &GenerateTemplateRequest{
//		TemplateID: "template-uuid",
//		Variables: []TemplateVariable{
//			{
//				Placeholder: "{user}",
//				MimeType:    &mimeTypeJSON,
//				Value: map[string]interface{}{
//					"firstName": "John",
//					"email":     "john@example.com",
//				},
//			},
//		},
//	})
//	// Template can use: {user.firstName}, {user.email}
//
//	// Advanced: loops with arrays
//	result, err := client.TurboTemplate.Generate(ctx, &GenerateTemplateRequest{
//		TemplateID: "template-uuid",
//		Variables: []TemplateVariable{
//			{
//				Placeholder: "{products}",
//				MimeType:    &mimeTypeJSON,
//				Value: []map[string]interface{}{
//					{"name": "Laptop", "price": 999},
//					{"name": "Mouse", "price": 29},
//				},
//			},
//		},
//	})
//	// Template can use: {#products}{name}: ${price}{/products}
func (c *TurboTemplateClient) Generate(ctx context.Context, req *GenerateTemplateRequest) (*GenerateTemplateResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("request cannot be nil")
	}

	if req.TemplateID == "" {
		return nil, fmt.Errorf("templateId is required")
	}

	if len(req.Variables) == 0 {
		return nil, fmt.Errorf("variables are required")
	}

	// Validate variables
	for i, v := range req.Variables {
		if v.Placeholder == "" {
			return nil, fmt.Errorf("variable %d must have Placeholder", i)
		}
		if v.Name == "" {
			return nil, fmt.Errorf("variable %d must have Name", i)
		}
		if v.MimeType == "" {
			return nil, fmt.Errorf("variable %d (%s) must have MimeType", i, v.Placeholder)
		}
		// Allow nil/null values - just check that at least one field is set
		// Note: We cannot distinguish between "field not set" vs "field set to nil" in Go
		// So we accept the variable as long as it has been initialized with either field
	}

	// Make request
	var result GenerateTemplateResponse
	err := c.httpClient.Post(ctx, "/v1/deliverable", req, &result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

// Download downloads a generated deliverable
//
// Parameters:
//   - ctx: Context for the request
//   - deliverableID: ID of the deliverable to download
//   - format: Download format - DownloadFormatSource (original DOCX/PPTX) or DownloadFormatPDF
//
// Returns the document file as bytes
//
// Example:
//
//	// Download in original format (DOCX/PPTX)
//	docBytes, err := client.TurboTemplate.Download(ctx, "deliverable-uuid", DownloadFormatSource)
//	if err != nil {
//	    log.Fatal(err)
//	}
//	os.WriteFile("document.docx", docBytes, 0644)
//
//	// Download as PDF
//	pdfBytes, err := client.TurboTemplate.Download(ctx, "deliverable-uuid", DownloadFormatPDF)
//	if err != nil {
//	    log.Fatal(err)
//	}
//	os.WriteFile("document.pdf", pdfBytes, 0644)
func (c *TurboTemplateClient) Download(ctx context.Context, deliverableID string, format DeliverableDownloadFormat) ([]byte, error) {
	if deliverableID == "" {
		return nil, fmt.Errorf("deliverableID is required")
	}

	var path string
	if format == DownloadFormatPDF {
		path = fmt.Sprintf("/v1/deliverable/file/pdf/%s", deliverableID)
	} else {
		path = fmt.Sprintf("/v1/deliverable/file/%s", deliverableID)
	}

	return c.httpClient.GetRaw(ctx, path)
}

// Helper functions for creating common variable types

// NewSimpleVariable creates a simple text variable
// placeholder: variable placeholder (e.g., "{customer_name}")
// name: variable name
// value: variable value
// mimeType: variable mime type (MimeTypeText or MimeTypeHTML)
// Returns error if any required parameter is missing or invalid
func NewSimpleVariable(placeholder string, name string, value interface{}, mimeType VariableMimeType) (TemplateVariable, error) {
	if placeholder == "" {
		return TemplateVariable{}, fmt.Errorf("placeholder is required")
	}
	if name == "" {
		return TemplateVariable{}, fmt.Errorf("name is required")
	}
	if mimeType == "" {
		return TemplateVariable{}, fmt.Errorf("mimeType is required")
	}
	if mimeType != MimeTypeText && mimeType != MimeTypeHTML {
		return TemplateVariable{}, fmt.Errorf("mimeType must be 'text' or 'html'")
	}
	return TemplateVariable{
		Placeholder: placeholder,
		Name:        name,
		Value:       value,
		MimeType:    mimeType,
	}, nil
}

// NewAdvancedEngineVariable creates an advanced engine variable (for nested objects, complex data)
// placeholder: variable placeholder (e.g., "{user}")
// name: variable name
// value: nested object/map value
// Returns error if any required parameter is missing
func NewAdvancedEngineVariable(placeholder string, name string, value map[string]interface{}) (TemplateVariable, error) {
	if placeholder == "" {
		return TemplateVariable{}, fmt.Errorf("placeholder is required")
	}
	if name == "" {
		return TemplateVariable{}, fmt.Errorf("name is required")
	}
	usesAdvanced := true
	return TemplateVariable{
		Placeholder:                  placeholder,
		Name:                         name,
		Value:                        value,
		MimeType:                     MimeTypeJSON,
		UsesAdvancedTemplatingEngine: &usesAdvanced,
	}, nil
}

// NewLoopVariable creates a loop/array variable
// placeholder: variable placeholder (e.g., "{products}")
// name: variable name
// value: array/slice value for iteration
// Returns error if any required parameter is missing
func NewLoopVariable(placeholder string, name string, value []interface{}) (TemplateVariable, error) {
	if placeholder == "" {
		return TemplateVariable{}, fmt.Errorf("placeholder is required")
	}
	if name == "" {
		return TemplateVariable{}, fmt.Errorf("name is required")
	}
	usesAdvanced := true
	return TemplateVariable{
		Placeholder:                  placeholder,
		Name:                         name,
		Value:                        value,
		MimeType:                     MimeTypeJSON,
		UsesAdvancedTemplatingEngine: &usesAdvanced,
	}, nil
}

// NewConditionalVariable creates a conditional variable
// placeholder: variable placeholder (e.g., "{showDetails}")
// name: variable name
// value: conditional value (typically boolean)
// Returns error if any required parameter is missing
func NewConditionalVariable(placeholder string, name string, value interface{}) (TemplateVariable, error) {
	if placeholder == "" {
		return TemplateVariable{}, fmt.Errorf("placeholder is required")
	}
	if name == "" {
		return TemplateVariable{}, fmt.Errorf("name is required")
	}
	usesAdvanced := true
	return TemplateVariable{
		Placeholder:                  placeholder,
		Name:                         name,
		Value:                        value,
		MimeType:                     MimeTypeJSON,
		UsesAdvancedTemplatingEngine: &usesAdvanced,
	}, nil
}

// NewImageVariable creates an image variable
// placeholder: variable placeholder (e.g., "{logo}")
// name: variable name
// imageURL: image URL or base64 data
// Returns error if any required parameter is missing
func NewImageVariable(placeholder string, name string, imageURL string) (TemplateVariable, error) {
	if placeholder == "" {
		return TemplateVariable{}, fmt.Errorf("placeholder is required")
	}
	if name == "" {
		return TemplateVariable{}, fmt.Errorf("name is required")
	}
	if imageURL == "" {
		return TemplateVariable{}, fmt.Errorf("imageURL is required")
	}
	return TemplateVariable{
		Placeholder: placeholder,
		Name:        name,
		Value:       imageURL,
		MimeType:    MimeTypeImage,
	}, nil
}
