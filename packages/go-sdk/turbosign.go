package turbodocx

import (
	"context"
	"encoding/json"
	"strings"
)

// TurboSignClient provides digital signature operations
// with 100% parity with n8n-nodes-turbodocx
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
	Name  string `json:"name"`
	Email string `json:"email"`
	Order int    `json:"order"`
}

// Field represents a signature field
type Field struct {
	Type           string `json:"type"`
	Page           int    `json:"page,omitempty"`
	X              int    `json:"x,omitempty"`
	Y              int    `json:"y,omitempty"`
	Width          int    `json:"width,omitempty"`
	Height         int    `json:"height,omitempty"`
	RecipientOrder int    `json:"recipientOrder"`
}

// PrepareForReviewRequest is the request for PrepareForReview
type PrepareForReviewRequest struct {
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

// PrepareForReviewResponse is the response from PrepareForReview
type PrepareForReviewResponse struct {
	DocumentID string                   `json:"documentId"`
	Status     string                   `json:"status"`
	PreviewURL string                   `json:"previewUrl,omitempty"`
	Recipients []RecipientStatusResponse `json:"recipients,omitempty"`
}

// PrepareForSigningRequest is the request for PrepareForSigningSingle
type PrepareForSigningRequest struct {
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

// PrepareForSigningResponse is the response from PrepareForSigningSingle
type PrepareForSigningResponse struct {
	DocumentID string                    `json:"documentId"`
	Status     string                    `json:"status"`
	Recipients []RecipientSignResponse   `json:"recipients"`
}

// RecipientStatusResponse represents a recipient's status
type RecipientStatusResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Status string `json:"status"`
}

// RecipientSignResponse represents a recipient with sign URL
type RecipientSignResponse struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Status  string `json:"status"`
	SignURL string `json:"signUrl,omitempty"`
}

// DocumentStatusResponse is the response from GetStatus
type DocumentStatusResponse struct {
	DocumentID  string                    `json:"documentId"`
	Status      string                    `json:"status"`
	Name        string                    `json:"name"`
	Recipients  []RecipientStatusResponse `json:"recipients"`
	CreatedAt   string                    `json:"createdAt"`
	UpdatedAt   string                    `json:"updatedAt"`
	CompletedAt string                    `json:"completedAt,omitempty"`
}

// VoidDocumentResponse is the response from VoidDocument
type VoidDocumentResponse struct {
	DocumentID string `json:"documentId"`
	Status     string `json:"status"`
	VoidedAt   string `json:"voidedAt"`
}

// ResendEmailResponse is the response from ResendEmail
type ResendEmailResponse struct {
	DocumentID string `json:"documentId"`
	Message    string `json:"message"`
	ResentAt   string `json:"resentAt"`
}

// ============================================
// N8N PARITY METHODS
// ============================================

// PrepareForReview prepares a document for review without sending emails.
// Use this to preview field placement before sending.
func (c *TurboSignClient) PrepareForReview(ctx context.Context, req *PrepareForReviewRequest) (*PrepareForReviewResponse, error) {
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
	if req.SenderName != "" {
		formData["senderName"] = req.SenderName
	}
	if req.SenderEmail != "" {
		formData["senderEmail"] = req.SenderEmail
	}
	if len(req.CCEmails) > 0 {
		formData["ccEmails"] = strings.Join(req.CCEmails, ",")
	}

	var response struct {
		Data PrepareForReviewResponse `json:"data"`
	}

	if len(req.File) > 0 {
		fileName := req.FileName
		if fileName == "" {
			fileName = "document.pdf"
		}
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

	return &response.Data, nil
}

// PrepareForSigningSingle prepares a document for signing and sends emails in a single call.
// This is the n8n-equivalent "Prepare for Signing" operation.
func (c *TurboSignClient) PrepareForSigningSingle(ctx context.Context, req *PrepareForSigningRequest) (*PrepareForSigningResponse, error) {
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
	if req.SenderName != "" {
		formData["senderName"] = req.SenderName
	}
	if req.SenderEmail != "" {
		formData["senderEmail"] = req.SenderEmail
	}
	if len(req.CCEmails) > 0 {
		formData["ccEmails"] = strings.Join(req.CCEmails, ",")
	}

	var response struct {
		Data PrepareForSigningResponse `json:"data"`
	}

	if len(req.File) > 0 {
		fileName := req.FileName
		if fileName == "" {
			fileName = "document.pdf"
		}
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

	return &response.Data, nil
}

// GetStatus gets the status of a document
func (c *TurboSignClient) GetStatus(ctx context.Context, documentID string) (*DocumentStatusResponse, error) {
	var response struct {
		Data DocumentStatusResponse `json:"data"`
	}

	err := c.http.Get(ctx, "/turbosign/documents/"+documentID+"/status", &response)
	if err != nil {
		return nil, err
	}

	return &response.Data, nil
}

// Download downloads the signed document as bytes
func (c *TurboSignClient) Download(ctx context.Context, documentID string) ([]byte, error) {
	return c.http.GetRaw(ctx, "/turbosign/documents/"+documentID+"/download")
}

// VoidDocument voids a document (cancels signature request)
func (c *TurboSignClient) VoidDocument(ctx context.Context, documentID string, reason string) (*VoidDocumentResponse, error) {
	var response struct {
		Data VoidDocumentResponse `json:"data"`
	}

	err := c.http.Post(ctx, "/turbosign/documents/"+documentID+"/void", map[string]string{"reason": reason}, &response)
	if err != nil {
		return nil, err
	}

	return &response.Data, nil
}

// ResendEmail resends signature request email to recipients
func (c *TurboSignClient) ResendEmail(ctx context.Context, documentID string, recipientIDs []string) (*ResendEmailResponse, error) {
	var response struct {
		Data ResendEmailResponse `json:"data"`
	}

	err := c.http.Post(ctx, "/turbosign/documents/"+documentID+"/resend-email", map[string][]string{"recipientIds": recipientIDs}, &response)
	if err != nil {
		return nil, err
	}

	return &response.Data, nil
}
