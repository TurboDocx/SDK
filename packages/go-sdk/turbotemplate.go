package turbodocx

import (
	"bytes"
	"context"
	"encoding/json"
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
	// TemplateID is the template ID to use for generation
	TemplateID string `json:"templateId"`

	// Variables to inject into the template
	Variables []TemplateVariable `json:"variables"`

	// Name is the document name
	Name *string `json:"name,omitempty"`

	// Description is the document description
	Description *string `json:"description,omitempty"`

	// ReplaceFonts replaces fonts in the document
	ReplaceFonts *bool `json:"replaceFonts,omitempty"`

	// DefaultFont is the default font to use when replacing
	DefaultFont *string `json:"defaultFont,omitempty"`

	// OutputFormat is the output format (default: docx)
	OutputFormat *string `json:"outputFormat,omitempty"`

	// Metadata is additional metadata
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// GenerateTemplateResponse is the response from template generation
type GenerateTemplateResponse struct {
	// Success indicates whether generation was successful
	Success bool `json:"success"`

	// DeliverableID is the deliverable ID
	DeliverableID *string `json:"deliverableId,omitempty"`

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
//   - Filters: {name | uppercase}
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
		if v.Value == nil && (v.Text == nil || *v.Text == "") {
			return nil, fmt.Errorf("variable %d (%s) must have either Value or Text", i, v.Placeholder)
		}
	}

	// Marshal request to JSON
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Make request
	resp, err := c.httpClient.Post(ctx, "/v1/deliverable", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Parse response
	var result GenerateTemplateResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// Helper functions for creating common variable types

// NewSimpleVariable creates a simple text variable
// name: variable name
// value: variable value
// placeholder: optional custom placeholder (pass empty string to use default {name})
func NewSimpleVariable(name string, value interface{}, placeholder ...string) TemplateVariable {
	p := ""
	if len(placeholder) > 0 && placeholder[0] != "" {
		p = placeholder[0]
	} else if len(name) > 0 && name[0] == '{' {
		p = name
	} else {
		p = "{" + name + "}"
	}
	return TemplateVariable{
		Placeholder: p,
		Name:        name,
		Value:       value,
		MimeType:    MimeTypeText,
	}
}

// NewNestedVariable creates a nested object variable
// name: variable name
// value: nested object/map value
// placeholder: optional custom placeholder (pass empty string to use default {name})
func NewNestedVariable(name string, value map[string]interface{}, placeholder ...string) TemplateVariable {
	p := ""
	if len(placeholder) > 0 && placeholder[0] != "" {
		p = placeholder[0]
	} else if len(name) > 0 && name[0] == '{' {
		p = name
	} else {
		p = "{" + name + "}"
	}
	usesAdvanced := true
	return TemplateVariable{
		Placeholder:                  p,
		Name:                         name,
		Value:                        value,
		MimeType:                     MimeTypeJSON,
		UsesAdvancedTemplatingEngine: &usesAdvanced,
	}
}

// NewLoopVariable creates a loop/array variable
// name: variable name
// value: array/slice value for iteration
// placeholder: optional custom placeholder (pass empty string to use default {name})
func NewLoopVariable(name string, value []interface{}, placeholder ...string) TemplateVariable {
	p := ""
	if len(placeholder) > 0 && placeholder[0] != "" {
		p = placeholder[0]
	} else if len(name) > 0 && name[0] == '{' {
		p = name
	} else {
		p = "{" + name + "}"
	}
	usesAdvanced := true
	return TemplateVariable{
		Placeholder:                  p,
		Name:                         name,
		Value:                        value,
		MimeType:                     MimeTypeJSON,
		UsesAdvancedTemplatingEngine: &usesAdvanced,
	}
}

// NewConditionalVariable creates a conditional variable
// name: variable name
// value: conditional value (typically boolean)
// placeholder: optional custom placeholder (pass empty string to use default {name})
func NewConditionalVariable(name string, value interface{}, placeholder ...string) TemplateVariable {
	p := ""
	if len(placeholder) > 0 && placeholder[0] != "" {
		p = placeholder[0]
	} else if len(name) > 0 && name[0] == '{' {
		p = name
	} else {
		p = "{" + name + "}"
	}
	usesAdvanced := true
	return TemplateVariable{
		Placeholder:                  p,
		Name:                         name,
		Value:                        value,
		MimeType:                     MimeTypeJSON,
		UsesAdvancedTemplatingEngine: &usesAdvanced,
	}
}

// NewImageVariable creates an image variable
// name: variable name
// imageURL: image URL or base64 data
// placeholder: optional custom placeholder (pass empty string to use default {name})
func NewImageVariable(name string, imageURL string, placeholder ...string) TemplateVariable {
	p := ""
	if len(placeholder) > 0 && placeholder[0] != "" {
		p = placeholder[0]
	} else if len(name) > 0 && name[0] == '{' {
		p = name
	} else {
		p = "{" + name + "}"
	}
	return TemplateVariable{
		Placeholder: p,
		Name:        name,
		Value:       imageURL,
		MimeType:    MimeTypeImage,
	}
}
