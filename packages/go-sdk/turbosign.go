package turbodocx

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
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
// Duration is a configured length of time.
//
// The unit is carried alongside the value rather than normalised away, so "48 hours" stays
// "48 hours" instead of reading back as "2 days".
type Duration struct {
	// Value is a whole number of units. Minimum 1, except ExpirationWarning where 0 means
	// "never warn".
	Value int `json:"value"`
	// Unit is "hours" or "days".
	Unit string `json:"unit"`
}

// SignatureSchedule holds per-document reminder + expiration overrides.
//
// Every field is a POINTER because "unset" must stay distinguishable from a deliberate false or
// 0: RemindersEnabled=false (feature off), MaxReminders=0 (no reminders) and MaxReminders=-1
// (unlimited) are all meaningful, and Go's zero values would otherwise silently fall back to the
// organization's default — the opposite of what the caller asked for.
//
// An omitted field inherits the org default; omitting the whole set means "use the org policy as
// it stands at send time". Both features are off by default.
type SignatureSchedule struct {
	// RemindersEnabled turns reminder emails on for this document.
	RemindersEnabled *bool
	// ReminderDelay is how long after the invitation before the FIRST reminder.
	ReminderDelay *Duration
	// ReminderInterval is the gap between subsequent reminders.
	ReminderInterval *Duration
	// MaxReminders caps reminders per signer. -1 means unlimited, 0 means none. Never caps
	// expiry warnings.
	MaxReminders *int
	// ExpirationEnabled closes the signing window after ExpireAfter.
	ExpirationEnabled *bool
	// ExpireAfter is how long the document stays signable, counted from sending.
	ExpireAfter *Duration
	// ExpirationWarning is how far BEFORE expiry warning emails start. A zero value means no
	// warnings at all.
	ExpirationWarning *Duration
	// ExpirationWarningInterval is the gap between warnings once the window is open.
	ExpirationWarningInterval *Duration
}

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

	// Per-document reminder + expiration overrides; omitted fields inherit the org defaults.
	SignatureSchedule
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

	// Per-document reminder + expiration overrides; omitted fields inherit the org defaults.
	SignatureSchedule
}

// SendSignatureResponse is the response from SendSignature
type SendSignatureResponse struct {
	Success    bool              `json:"success"`
	DocumentID string            `json:"documentId"`
	Status     string            `json:"status"`
	Message    string            `json:"message"`
	Recipients []ReviewRecipient `json:"recipients,omitempty"`
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
	// ExpiresAt is when the signing window closes, if the document has a deadline. Empty when
	// expiration is off (the default), which means the document never expires.
	ExpiresAt string `json:"expiresAt,omitempty"`
}

// ReminderResult is the outcome for one recipient of a reminder request.
type ReminderResult struct {
	RecipientID string `json:"recipientId"`
	// Status is e.g. "sent", "skipped_wrong_order", "skipped_completed".
	Status string `json:"status"`
	// ReminderCount is the count after the send; only meaningful when Status is "sent".
	ReminderCount int `json:"reminderCount,omitempty"`
	// Phase is "reminder" or "expiring" — which email was sent.
	Phase string `json:"phase,omitempty"`
}

// SendReminderResponse is the response from SendReminder.
type SendReminderResponse struct {
	// Results holds one entry per recipient considered, including those skipped and why.
	Results []ReminderResult `json:"results"`
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
	recipientsJSON, err := json.Marshal(req.Recipients)
	if err != nil {
		return nil, fmt.Errorf("marshal recipients: %w", err)
	}
	fieldsJSON, err := json.Marshal(req.Fields)
	if err != nil {
		return nil, fmt.Errorf("marshal fields: %w", err)
	}

	// Get sender config from client
	senderEmail, senderName := c.http.GetSenderConfig()

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
		ccEmailsJSON, err := json.Marshal(req.CCEmails)
		if err != nil {
			return nil, fmt.Errorf("marshal ccEmails: %w", err)
		}
		formData["ccEmails"] = string(ccEmailsJSON)
	}

	// Per-document reminder + expiration overrides; omitted fields inherit the org defaults.
	if err := applyScheduleOverrides(formData, req.SignatureSchedule); err != nil {
		return nil, err
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
	recipientsJSON, err := json.Marshal(req.Recipients)
	if err != nil {
		return nil, fmt.Errorf("marshal recipients: %w", err)
	}
	fieldsJSON, err := json.Marshal(req.Fields)
	if err != nil {
		return nil, fmt.Errorf("marshal fields: %w", err)
	}

	// Get sender config from client
	senderEmail, senderName := c.http.GetSenderConfig()

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
		ccEmailsJSON, err := json.Marshal(req.CCEmails)
		if err != nil {
			return nil, fmt.Errorf("marshal ccEmails: %w", err)
		}
		formData["ccEmails"] = string(ccEmailsJSON)
	}

	// Per-document reminder + expiration overrides; omitted fields inherit the org defaults.
	if err := applyScheduleOverrides(formData, req.SignatureSchedule); err != nil {
		return nil, err
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
			Code:    "NETWORK_ERROR",
			Message: fmt.Sprintf("failed to download file: %v", err),
		}}
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, &NetworkError{TurboDocxError: TurboDocxError{
			Code:       "NETWORK_ERROR",
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

// applyScheduleOverrides copies per-document reminder/expiration overrides onto an outgoing
// request body.
//
// Durations are JSON-encoded. multipart/form-data has no notion of a nested value, so a
// {value, unit} object cannot survive the file-upload path as an object. The API decodes a
// JSON-string duration on both content types, so encoding uniformly keeps one code path for the
// multipart and JSON branches — the same treatment recipients and fields already get.
//
// Nil pointers are skipped, which is what preserves "unset" as distinct from a deliberate false
// or 0.
// Scalars are formatted as strings because formData is map[string]string on both the multipart
// and JSON branches — the API's validation coerces them, exactly as it already does for the
// JSON-encoded recipients, fields and ccEmails this SDK sends.
func applyScheduleOverrides(formData map[string]string, schedule SignatureSchedule) error {
	if schedule.RemindersEnabled != nil {
		formData["remindersEnabled"] = strconv.FormatBool(*schedule.RemindersEnabled)
	}
	if schedule.MaxReminders != nil {
		formData["maxReminders"] = strconv.Itoa(*schedule.MaxReminders)
	}
	if schedule.ExpirationEnabled != nil {
		formData["expirationEnabled"] = strconv.FormatBool(*schedule.ExpirationEnabled)
	}

	durations := []struct {
		key      string
		duration *Duration
	}{
		{"reminderDelay", schedule.ReminderDelay},
		{"reminderInterval", schedule.ReminderInterval},
		{"expireAfter", schedule.ExpireAfter},
		{"expirationWarning", schedule.ExpirationWarning},
		{"expirationWarningInterval", schedule.ExpirationWarningInterval},
	}
	for _, d := range durations {
		if d.duration == nil {
			continue
		}
		encoded, err := json.Marshal(d.duration)
		if err != nil {
			return fmt.Errorf("marshal %s: %w", d.key, err)
		}
		formData[d.key] = string(encoded)
	}

	return nil
}

// SendReminder sends a reminder email to a document's outstanding signers.
//
// This is a standalone nudge, deliberately decoupled from the automatic reminder schedule: it
// ignores the configured cadence, works even when reminders are disabled or the per-signer cap is
// already spent, and does not consume that cap.
//
// Only signers at the CURRENT signing order are emailed. A recipient at a later order (or one who
// has already signed) is reported back as skipped rather than silently dropped, so the caller can
// tell that nobody was emailed.
//
// Pass nil (or an empty slice) for recipientIDs to remind every eligible signer. When ids are
// supplied the request is all-or-nothing: if any is not a current-order pending signer the API
// rejects the whole call and sends nothing.
func (c *TurboSignClient) SendReminder(ctx context.Context, documentID string, recipientIDs []string) (*SendReminderResponse, error) {
	var response SendReminderResponse

	// Only include the filter when it actually names someone. The API requires at least one id
	// when the key is present, so forwarding an empty slice would guarantee a 400 — an empty list
	// is far more likely to mean "no filter" than "remind nobody".
	body := map[string]interface{}{}
	if len(recipientIDs) > 0 {
		body["recipientIds"] = recipientIDs
	}

	err := c.http.Post(ctx, "/turbosign/documents/"+documentID+"/send-reminder", body, &response)
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
