package turbodocx

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// TurboSignClient provides digital signature operations
type TurboSignClient struct {
	http *HTTPClient
}

// NewTurboSignClient creates a new TurboSign client
func NewTurboSignClient(http *HTTPClient) *TurboSignClient {
	return &TurboSignClient{http: http}
}

// ============================================
// Types
// ============================================

// Recipient represents a document recipient
type Recipient struct {
	Name         string `json:"name"`
	Email        string `json:"email"`
	SigningOrder int    `json:"signingOrder"`
}

// TemplateAnchor represents template anchor configuration for dynamic field positioning
type TemplateAnchor struct {
	Anchor        string `json:"anchor,omitempty"`
	SearchText    string `json:"searchText,omitempty"`
	Placement     string `json:"placement,omitempty"` // replace, before, after, above, below
	Size          *Size  `json:"size,omitempty"`
	Offset        *Point `json:"offset,omitempty"`
	CaseSensitive bool   `json:"caseSensitive,omitempty"`
	UseRegex      bool   `json:"useRegex,omitempty"`
}

// Size represents width and height
type Size struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// Point represents x and y coordinates
type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Field represents a signature field
type Field struct {
	Type            string          `json:"type"`
	Page            int             `json:"page,omitempty"`
	X               int             `json:"x,omitempty"`
	Y               int             `json:"y,omitempty"`
	Width           int             `json:"width,omitempty"`
	Height          int             `json:"height,omitempty"`
	RecipientEmail  string          `json:"recipientEmail"`
	DefaultValue    string          `json:"defaultValue,omitempty"`
	IsMultiline     bool            `json:"isMultiline,omitempty"`
	IsReadonly      bool            `json:"isReadonly,omitempty"`
	Required        bool            `json:"required,omitempty"`
	BackgroundColor string          `json:"backgroundColor,omitempty"`
	Template        *TemplateAnchor `json:"template,omitempty"`
}

// CreateSignatureReviewLinkRequest is the request for CreateSignatureReviewLink
type CreateSignatureReviewLinkRequest struct {
	// File content (use this OR FileLink/DeliverableID/TemplateID)
	File     []byte
	FileName string

	// Alternative file sources
	FileLink      string
	DeliverableID string
	TemplateID    string

	// Required
	Recipients []Recipient
	Fields     []Field

	// Optional
	DocumentName        string
	DocumentDescription string
	SenderName          string
	SenderEmail         string
	CCEmails            []string
}

// ReviewRecipient represents a recipient in the review link response
type ReviewRecipient struct {
	ID       string                 `json:"id"`
	Name     string                 `json:"name"`
	Email    string                 `json:"email"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// CreateSignatureReviewLinkResponse is the response from CreateSignatureReviewLink
type CreateSignatureReviewLinkResponse struct {
	Success    bool              `json:"success"`
	DocumentID string            `json:"documentId"`
	Status     string            `json:"status"`
	PreviewURL string            `json:"previewUrl,omitempty"`
	Message    string            `json:"message"`
	Recipients []ReviewRecipient `json:"recipients,omitempty"`
}

// SendSignatureRequest is the request for SendSignature
type SendSignatureRequest struct {
	// File content (use this OR FileLink/DeliverableID/TemplateID)
	File     []byte
	FileName string

	// Alternative file sources
	FileLink      string
	DeliverableID string
	TemplateID    string

	// Required
	Recipients []Recipient
	Fields     []Field

	// Optional
	DocumentName        string
	DocumentDescription string
	SenderName          string
	SenderEmail         string
	CCEmails            []string
}

// SendSignatureResponse is the response from SendSignature
type SendSignatureResponse struct {
	Success    bool   `json:"success"`
	DocumentID string `json:"documentId"`
	Message    string `json:"message"`
}

// RecipientResponse represents a recipient in the response
type RecipientResponse struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	SignURL  string `json:"signUrl,omitempty"`
	SignedAt string `json:"signedAt,omitempty"`
}

// DocumentStatusResponse is the response from GetStatus
type DocumentStatusResponse struct {
	Status string `json:"status"`
}

// VoidDocumentResponse is the response from VoidDocument
type VoidDocumentResponse struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Status     string `json:"status"`
	VoidReason string `json:"voidReason,omitempty"`
	VoidedAt   string `json:"voidedAt,omitempty"`
}

// ResendEmailResponse is the response from ResendEmail
type ResendEmailResponse struct {
	Success        bool `json:"success"`
	RecipientCount int  `json:"recipientCount"`
}

// DownloadResponse is the API response for download request
type DownloadResponse struct {
	DownloadURL string `json:"downloadUrl"`
	FileName    string `json:"fileName"`
}

// AuditTrailUser represents user info in audit trail
type AuditTrailUser struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// AuditTrailEntry represents a single audit trail entry
type AuditTrailEntry struct {
	ID           string                 `json:"id"`
	DocumentID   string                 `json:"documentId"`
	ActionType   string                 `json:"actionType"`
	Timestamp    string                 `json:"timestamp"`
	PreviousHash string                 `json:"previousHash,omitempty"`
	CurrentHash  string                 `json:"currentHash,omitempty"`
	CreatedOn    string                 `json:"createdOn,omitempty"`
	Details      map[string]interface{} `json:"details,omitempty"`
	User         *AuditTrailUser        `json:"user,omitempty"`
	UserID       string                 `json:"userId,omitempty"`
	Recipient    *AuditTrailUser        `json:"recipient,omitempty"`
	RecipientID  string                 `json:"recipientId,omitempty"`
}

// AuditTrailDocument represents document info in audit trail response
type AuditTrailDocument struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// AuditTrailResponse is the response from GetAuditTrail
// Note: HTTP client auto-unwraps "data" wrapper, so this matches the inner structure
type AuditTrailResponse struct {
	Document   AuditTrailDocument `json:"document"`
	AuditTrail []AuditTrailEntry  `json:"auditTrail"`
}

// ============================================
// TurboSign Methods
// ============================================

// CreateSignatureReviewLink prepares a document for review without sending emails.
// Use this to preview field placement before sending.
func (c *TurboSignClient) CreateSignatureReviewLink(ctx context.Context, req *CreateSignatureReviewLinkRequest) (*CreateSignatureReviewLinkResponse, error) {
	// Validate senderEmail is configured for TurboSign operations
	senderEmail, senderName := c.http.GetSenderConfig()
	if senderEmail == "" {
		return nil, &ValidationError{
			TurboDocxError: TurboDocxError{
				Message:    "SenderEmail is required for TurboSign operations. Please configure the client with SenderEmail.",
				StatusCode: 400,
			},
		}
	}

	recipientsJSON, _ := json.Marshal(req.Recipients)
	fieldsJSON, _ := json.Marshal(req.Fields)

	formData := map[string]string{
		"recipients": string(recipientsJSON),
		"fields":     string(fieldsJSON),
	}

	if req.DocumentName != "" {
		formData["documentName"] = req.DocumentName
	}
	if req.DocumentDescription != "" {
		formData["documentDescription"] = req.DocumentDescription
	}

	// Use request senderEmail/senderName if provided, otherwise fall back to configured values
	if req.SenderEmail != "" {
		formData["senderEmail"] = req.SenderEmail
	} else {
		formData["senderEmail"] = senderEmail
	}
	if req.SenderName != "" {
		formData["senderName"] = req.SenderName
	} else if senderName != "" {
		formData["senderName"] = senderName
	}

	if len(req.CCEmails) > 0 {
		ccEmailsJSON, _ := json.Marshal(req.CCEmails)
		formData["ccEmails"] = string(ccEmailsJSON)
	}

	var response CreateSignatureReviewLinkResponse

	if len(req.File) > 0 {
		fileName := req.FileName
		err := c.http.UploadFile(ctx, "/turbosign/single/prepare-for-review", req.File, fileName, formData, &response)
		if err != nil {
			return nil, err
		}
	} else {
		if req.FileLink != "" {
			formData["fileLink"] = req.FileLink
		}
		if req.DeliverableID != "" {
			formData["deliverableId"] = req.DeliverableID
		}
		if req.TemplateID != "" {
			formData["templateId"] = req.TemplateID
		}

		err := c.http.Post(ctx, "/turbosign/single/prepare-for-review", formData, &response)
		if err != nil {
			return nil, err
		}
	}

	return &response, nil
}

// SendSignature prepares a document for signing and sends emails in a single call.
func (c *TurboSignClient) SendSignature(ctx context.Context, req *SendSignatureRequest) (*SendSignatureResponse, error) {
	// Validate senderEmail is configured for TurboSign operations
	senderEmail, senderName := c.http.GetSenderConfig()
	if senderEmail == "" {
		return nil, &ValidationError{
			TurboDocxError: TurboDocxError{
				Message:    "SenderEmail is required for TurboSign operations. Please configure the client with SenderEmail.",
				StatusCode: 400,
			},
		}
	}

	recipientsJSON, _ := json.Marshal(req.Recipients)
	fieldsJSON, _ := json.Marshal(req.Fields)

	formData := map[string]string{
		"recipients": string(recipientsJSON),
		"fields":     string(fieldsJSON),
	}

	if req.DocumentName != "" {
		formData["documentName"] = req.DocumentName
	}
	if req.DocumentDescription != "" {
		formData["documentDescription"] = req.DocumentDescription
	}

	// Use request senderEmail/senderName if provided, otherwise fall back to configured values
	if req.SenderEmail != "" {
		formData["senderEmail"] = req.SenderEmail
	} else {
		formData["senderEmail"] = senderEmail
	}
	if req.SenderName != "" {
		formData["senderName"] = req.SenderName
	} else if senderName != "" {
		formData["senderName"] = senderName
	}

	if len(req.CCEmails) > 0 {
		ccEmailsJSON, _ := json.Marshal(req.CCEmails)
		formData["ccEmails"] = string(ccEmailsJSON)
	}

	var response SendSignatureResponse

	if len(req.File) > 0 {
		fileName := req.FileName
		err := c.http.UploadFile(ctx, "/turbosign/single/prepare-for-signing", req.File, fileName, formData, &response)
		if err != nil {
			return nil, err
		}
	} else {
		if req.FileLink != "" {
			formData["fileLink"] = req.FileLink
		}
		if req.DeliverableID != "" {
			formData["deliverableId"] = req.DeliverableID
		}
		if req.TemplateID != "" {
			formData["templateId"] = req.TemplateID
		}

		err := c.http.Post(ctx, "/turbosign/single/prepare-for-signing", formData, &response)
		if err != nil {
			return nil, err
		}
	}

	return &response, nil
}

// GetStatus gets the status of a document
func (c *TurboSignClient) GetStatus(ctx context.Context, documentID string) (*DocumentStatusResponse, error) {
	var response DocumentStatusResponse

	err := c.http.Get(ctx, "/turbosign/documents/"+documentID+"/status", &response)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

// Download downloads the signed document as bytes.
// The backend returns a presigned S3 URL, which this method fetches.
func (c *TurboSignClient) Download(ctx context.Context, documentID string) ([]byte, error) {
	// Get presigned URL from API
	var downloadResponse DownloadResponse
	err := c.http.Get(ctx, "/turbosign/documents/"+documentID+"/download", &downloadResponse)
	if err != nil {
		return nil, err
	}

	if downloadResponse.DownloadURL == "" {
		return nil, fmt.Errorf("no download URL in response")
	}

	// Fetch actual file from S3
	resp, err := http.Get(downloadResponse.DownloadURL)
	if err != nil {
		return nil, &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("failed to download file: %v", err),
		}}
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, &NetworkError{TurboDocxError: TurboDocxError{
			Message:    fmt.Sprintf("failed to download file: %s", resp.Status),
			StatusCode: resp.StatusCode,
		}}
	}

	return io.ReadAll(resp.Body)
}

// VoidDocument voids a document (cancels signature request)
func (c *TurboSignClient) VoidDocument(ctx context.Context, documentID string, reason string) (*VoidDocumentResponse, error) {
	var response VoidDocumentResponse
	err := c.http.Post(ctx, "/turbosign/documents/"+documentID+"/void", map[string]string{"reason": reason}, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// ResendEmail resends signature request email to recipients
func (c *TurboSignClient) ResendEmail(ctx context.Context, documentID string, recipientIDs []string) (*ResendEmailResponse, error) {
	var response ResendEmailResponse

	err := c.http.Post(ctx, "/turbosign/documents/"+documentID+"/resend-email", map[string][]string{"recipientIds": recipientIDs}, &response)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

// GetAuditTrail gets the audit trail for a document
func (c *TurboSignClient) GetAuditTrail(ctx context.Context, documentID string) (*AuditTrailResponse, error) {
	var response AuditTrailResponse

	err := c.http.Get(ctx, "/turbosign/documents/"+documentID+"/audit-trail", &response)
	if err != nil {
		return nil, err
	}

	return &response, nil
}
