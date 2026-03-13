package turbodocx

import (
	"context"
	"fmt"
	"net/url"
)

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
	IsDisabled bool `json:"isDisabled,omitempty"`
	// Nested sub-variables for HTML content
	Subvariables []DeliverableVariable `json:"subvariables,omitempty"`
	// Multiple instances for repeating content
	VariableStack interface{} `json:"variableStack,omitempty"`
	// AI prompt for content generation (max 16,000 chars)
	AIPrompt string `json:"aiPrompt,omitempty"`
	// Whether to allow rich text injection
	AllowRichTextInjection bool `json:"allowRichTextInjection,omitempty"`
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
	Column0  string
	Order0   string
}

// ListDeliverableItemsOptions holds query parameters for listing deliverable items
type ListDeliverableItemsOptions struct {
	Limit        int
	Offset       int
	Query        string
	ShowTags     bool
	SelectedTags []string
	Column0      string
	Order0       string
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
	ID   string `json:"id"`
	Name string `json:"name"`
}

// Font represents a font used in a deliverable
type Font struct {
	Name  string `json:"name"`
	Usage string `json:"usage"`
}

// DeliverableRecord represents a deliverable document
type DeliverableRecord struct {
	ID                string                `json:"id"`
	Name              string                `json:"name"`
	Description       string                `json:"description"`
	TemplateID        string                `json:"templateId"`
	TemplateName      string                `json:"templateName,omitempty"`
	TemplateNotDeleted *bool                `json:"templateNotDeleted,omitempty"`
	CreatedBy         string                `json:"createdBy"`
	Email             string                `json:"email,omitempty"`
	FileSize          int64                 `json:"fileSize,omitempty"`
	FileType          string                `json:"fileType,omitempty"`
	DefaultFont       string                `json:"defaultFont,omitempty"`
	Fonts             []Font                `json:"fonts,omitempty"`
	IsActive          bool                  `json:"isActive"`
	CreatedOn         string                `json:"createdOn"`
	UpdatedOn         string                `json:"updatedOn"`
	Variables         []DeliverableVariable `json:"variables,omitempty"`
	Tags              []Tag                 `json:"tags,omitempty"`
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

// DeliverableItem represents an item in the deliverable library
type DeliverableItem struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	Description       string `json:"description,omitempty"`
	Type              string `json:"type"`
	CreatedOn         string `json:"createdOn"`
	UpdatedOn         string `json:"updatedOn"`
	IsActive          bool   `json:"isActive"`
	CreatedBy         string `json:"createdBy"`
	Email             string `json:"email,omitempty"`
	FileSize          int64  `json:"fileSize,omitempty"`
	FileType          string `json:"fileType,omitempty"`
	DeliverableCount  int    `json:"deliverableCount,omitempty"`
	TemplateNotDeleted *bool `json:"templateNotDeleted,omitempty"`
	Tags              []Tag  `json:"tags,omitempty"`
}

// DeliverableItemListResponse is the response from ListDeliverableItems
type DeliverableItemListResponse struct {
	Results      []DeliverableItem `json:"results"`
	TotalRecords int               `json:"totalRecords"`
}

// DeliverableItemResponse is the response from GetDeliverableItem
type DeliverableItemResponse struct {
	Results DeliverableItem `json:"results"`
	Type    string          `json:"type"`
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
		path += buildListParams(opts.Limit, opts.Offset, opts.Query, opts.ShowTags, nil, opts.Column0, opts.Order0)
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

// ============================================
// Deliverable Items
// ============================================

// ListDeliverableItems lists all deliverable items with filtering and pagination
func (c *DeliverableClient) ListDeliverableItems(ctx context.Context, opts *ListDeliverableItemsOptions) (*DeliverableItemListResponse, error) {
	path := "/v1/deliverable-item"
	if opts != nil {
		path += buildListParams(opts.Limit, opts.Offset, opts.Query, opts.ShowTags, opts.SelectedTags, opts.Column0, opts.Order0)
	}

	var response DeliverableItemListResponse
	if err := c.http.Get(ctx, path, &response); err != nil {
		return nil, err
	}
	return &response, nil
}

// GetDeliverableItem gets a single deliverable item by ID
func (c *DeliverableClient) GetDeliverableItem(ctx context.Context, id string, opts *GetDeliverableOptions) (*DeliverableItemResponse, error) {
	path := "/v1/deliverable-item/" + id
	if opts != nil && opts.ShowTags {
		path += "?showTags=true"
	}

	var response DeliverableItemResponse
	if err := c.http.Get(ctx, path, &response); err != nil {
		return nil, err
	}
	return &response, nil
}
