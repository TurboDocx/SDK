package turbodocx

import (
	"context"
	"fmt"
	"net/url"
)

// FlexBool is a bool that can unmarshal from both JSON booleans (true/false) and numbers (1/0).
// MySQL returns tinyint(1) for boolean columns, which some APIs pass through as 0/1.
type FlexBool bool

func (b *FlexBool) UnmarshalJSON(data []byte) error {
	switch string(data) {
	case "true", "1":
		*b = true
	case "false", "0":
		*b = false
	default:
		return fmt.Errorf("FlexBool: cannot unmarshal %s", string(data))
	}
	return nil
}

func (b FlexBool) MarshalJSON() ([]byte, error) {
	if b {
		return []byte("true"), nil
	}
	return []byte("false"), nil
}

// DeliverableClient provides document generation and management operations
type DeliverableClient struct {
	http *HTTPClient
}

// NewDeliverableClient creates a new Deliverable client
func NewDeliverableClient(http *HTTPClient) *DeliverableClient {
	return &DeliverableClient{http: http}
}

// ============================================
// Types
// ============================================

// VariableStackEntry represents a single entry in a variable stack
type VariableStackEntry struct {
	Text     string `json:"text"`
	MimeType string `json:"mimeType"`
}

// DeliverableVariable represents a variable for template substitution
type DeliverableVariable struct {
	// Template placeholder (e.g., "{CompanyName}")
	Placeholder string `json:"placeholder"`
	// Value to inject
	Text string `json:"text,omitempty"`
	// Content type: text, html, image, or markdown
	MimeType string `json:"mimeType"`
	// Skip this variable during generation
	IsDisabled FlexBool `json:"isDisabled,omitempty"`
	// Nested sub-variables for HTML content
	Subvariables []DeliverableVariable `json:"subvariables,omitempty"`
	// Multiple instances for repeating content
	VariableStack interface{} `json:"variableStack,omitempty"`
	// AI prompt for content generation (max 16,000 chars)
	AIPrompt string `json:"aiPrompt,omitempty"`
	// Whether to allow rich text injection
	AllowRichTextInjection FlexBool `json:"allowRichTextInjection,omitempty"`
}

// CreateDeliverableRequest is the request for GenerateDeliverable
type CreateDeliverableRequest struct {
	// Deliverable name (3-255 characters)
	Name string `json:"name"`
	// Template ID to generate from
	TemplateID string `json:"templateId"`
	// Array of variable objects for substitution
	Variables []DeliverableVariable `json:"variables"`
	// Description (up to 65,535 characters)
	Description string `json:"description,omitempty"`
	// Array of tag strings to associate
	Tags []string `json:"tags,omitempty"`
}

// UpdateDeliverableRequest is the request for UpdateDeliverableInfo
type UpdateDeliverableRequest struct {
	// Updated name (3-255 characters)
	Name string `json:"name,omitempty"`
	// Updated description
	Description string `json:"description,omitempty"`
	// Replace all tags (pass empty slice to remove all)
	Tags *[]string `json:"tags,omitempty"`
}

// ListDeliverablesOptions holds query parameters for listing deliverables
type ListDeliverablesOptions struct {
	Limit    int
	Offset   int
	Query    string
	ShowTags bool
}

// GetDeliverableOptions holds query parameters for getting a single deliverable
type GetDeliverableOptions struct {
	ShowTags bool
}

// ============================================
// Response Types
// ============================================

// Tag represents a tag attached to a deliverable
type Tag struct {
	ID        string   `json:"id"`
	Label     string   `json:"label"`
	IsActive  FlexBool `json:"isActive"`
	UpdatedOn string   `json:"updatedOn"`
	CreatedOn string   `json:"createdOn"`
	CreatedBy string   `json:"createdBy"`
	OrgID     string   `json:"orgId"`
}

// Font represents a font used in a deliverable
type Font struct {
	Name  string      `json:"name"`
	Usage interface{} `json:"usage"`
}

// DeliverableRecord represents a deliverable document
type DeliverableRecord struct {
	ID                 string                `json:"id"`
	Name               string                `json:"name"`
	Description        string                `json:"description"`
	TemplateID         string                `json:"templateId"`
	TemplateName       string                `json:"templateName"`
	TemplateNotDeleted *FlexBool             `json:"templateNotDeleted"`
	CreatedBy          string                `json:"createdBy"`
	Email              string                `json:"email"`
	FileSize           int64                 `json:"fileSize"`
	FileType           string                `json:"fileType"`
	DefaultFont        string                `json:"defaultFont"`
	Fonts              []Font                `json:"fonts"`
	IsActive           FlexBool              `json:"isActive"`
	CreatedOn          string                `json:"createdOn"`
	UpdatedOn          string                `json:"updatedOn"`
	Variables          []DeliverableVariable `json:"variables"`
	Tags               []Tag                 `json:"tags"`
}

// DeliverableListResponse is the response from ListDeliverables
type DeliverableListResponse struct {
	Results      []DeliverableRecord `json:"results"`
	TotalRecords int                 `json:"totalRecords"`
}

// CreateDeliverableResponse is the response from GenerateDeliverable
type CreateDeliverableResponse struct {
	Results struct {
		Deliverable DeliverableRecord `json:"deliverable"`
	} `json:"results"`
}

// GetDeliverableResponse wraps the results for getDeliverableDetails
type GetDeliverableResponse struct {
	Results DeliverableRecord `json:"results"`
}

// UpdateDeliverableResponse is the response from UpdateDeliverableInfo
type UpdateDeliverableResponse struct {
	Message       string `json:"message"`
	DeliverableID string `json:"deliverableId"`
}

// DeleteDeliverableResponse is the response from DeleteDeliverable
type DeleteDeliverableResponse struct {
	Message       string `json:"message"`
	DeliverableID string `json:"deliverableId"`
}

// ============================================
// Helper
// ============================================

func buildListParams(limit, offset int, query string, showTags bool, selectedTags []string, column0, order0 string) string {
	params := url.Values{}
	if limit > 0 {
		params.Set("limit", fmt.Sprintf("%d", limit))
	}
	if offset > 0 {
		params.Set("offset", fmt.Sprintf("%d", offset))
	}
	if query != "" {
		params.Set("query", query)
	}
	if showTags {
		params.Set("showTags", "true")
	}
	if len(selectedTags) > 0 {
		for _, tag := range selectedTags {
			params.Add("selectedTags", tag)
		}
	}
	if column0 != "" {
		params.Set("column0", column0)
	}
	if order0 != "" {
		params.Set("order0", order0)
	}
	encoded := params.Encode()
	if encoded != "" {
		return "?" + encoded
	}
	return ""
}

// ============================================
// Deliverable CRUD Methods
// ============================================

// ListDeliverables lists deliverables with pagination, search, and filtering
func (c *DeliverableClient) ListDeliverables(ctx context.Context, opts *ListDeliverablesOptions) (*DeliverableListResponse, error) {
	path := "/v1/deliverable"
	if opts != nil {
		path += buildListParams(opts.Limit, opts.Offset, opts.Query, opts.ShowTags, nil, "", "")
	}

	var response DeliverableListResponse
	if err := c.http.Get(ctx, path, &response); err != nil {
		return nil, err
	}
	return &response, nil
}

// GenerateDeliverable generates a new deliverable document from a template with variable substitution
func (c *DeliverableClient) GenerateDeliverable(ctx context.Context, req *CreateDeliverableRequest) (*CreateDeliverableResponse, error) {
	var response CreateDeliverableResponse
	if err := c.http.Post(ctx, "/v1/deliverable", req, &response); err != nil {
		return nil, err
	}
	return &response, nil
}

// GetDeliverableDetails gets full details of a single deliverable
func (c *DeliverableClient) GetDeliverableDetails(ctx context.Context, id string, opts *GetDeliverableOptions) (*DeliverableRecord, error) {
	path := "/v1/deliverable/" + id
	if opts != nil && opts.ShowTags {
		path += "?showTags=true"
	}

	var response GetDeliverableResponse
	if err := c.http.Get(ctx, path, &response); err != nil {
		return nil, err
	}
	return &response.Results, nil
}

// UpdateDeliverableInfo updates a deliverable's name, description, or tags
func (c *DeliverableClient) UpdateDeliverableInfo(ctx context.Context, id string, req *UpdateDeliverableRequest) (*UpdateDeliverableResponse, error) {
	var response UpdateDeliverableResponse
	if err := c.http.Patch(ctx, "/v1/deliverable/"+id, req, &response); err != nil {
		return nil, err
	}
	return &response, nil
}

// DeleteDeliverable soft-deletes a deliverable
func (c *DeliverableClient) DeleteDeliverable(ctx context.Context, id string) (*DeleteDeliverableResponse, error) {
	var response DeleteDeliverableResponse
	if err := c.http.Delete(ctx, "/v1/deliverable/"+id, &response); err != nil {
		return nil, err
	}
	return &response, nil
}

// ============================================
// File Downloads
// ============================================

// DownloadSourceFile downloads the original source file (DOCX or PPTX) of a deliverable
func (c *DeliverableClient) DownloadSourceFile(ctx context.Context, deliverableID string) ([]byte, error) {
	return c.http.GetRaw(ctx, "/v1/deliverable/file/"+deliverableID)
}

// DownloadPDF downloads the PDF version of a deliverable
func (c *DeliverableClient) DownloadPDF(ctx context.Context, deliverableID string) ([]byte, error) {
	return c.http.GetRaw(ctx, "/v1/deliverable/file/pdf/"+deliverableID)
}

