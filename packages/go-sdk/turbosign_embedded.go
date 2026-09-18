package turbodocx

import (
	"context"
	"fmt"
	"sort"
	"strings"
)

// ============================================
// Embedded signing types
// ============================================

// IdentityVerification describes how an embedded recipient's identity is verified before they can
// sign. It mirrors the JS SDK's discriminated union on Mode; in Go the mode-specific fields live
// alongside each other and are populated per mode:
//
//   - Mode "otp": TurboSign emails or texts a one-time passcode. Channel is "email" or "sms"
//     (SMS requires the recipient's Phone in E.164).
//   - Mode "external_idv": your own identity provider verifies the signer. Set Provider (and
//     optionally MaxAgeMinutes); pass the assertion to CreateSigningURL via IdentityAssertion.
//   - Mode "override": skip identity verification entirely (development/testing; your org admin
//     must enable it). Set OverrideIdentityVerification=true and a non-empty Reason.
type IdentityVerification struct {
	// Mode is "otp", "external_idv" or "override".
	Mode string `json:"mode"`
	// Channel is "email" or "sms" — only for Mode "otp".
	Channel string `json:"channel,omitempty"`
	// Provider is the identity provider name — only for Mode "external_idv".
	Provider string `json:"provider,omitempty"`
	// MaxAgeMinutes bounds how old an external assertion may be — only for Mode "external_idv".
	MaxAgeMinutes int `json:"maxAgeMinutes,omitempty"`
	// OverrideIdentityVerification acknowledges skipping verification — only for Mode "override".
	OverrideIdentityVerification bool `json:"overrideIdentityVerification,omitempty"`
	// Reason records why verification was skipped — only for Mode "override".
	Reason string `json:"reason,omitempty"`
}

// IdentityAssertion is an assertion from your own provider, passed when requesting an external_idv
// signing URL.
type IdentityAssertion struct {
	// Provider must match the recipient's configured provider.
	Provider string `json:"provider"`
	// VerificationID is your provider's unique id for this verification (used to detect replay).
	VerificationID string `json:"verificationId"`
	// VerifiedAt is when your provider verified the signer (ISO 8601). Rejected if in the future
	// or too old.
	VerifiedAt string `json:"verifiedAt"`
	// SubjectEmail is the email your provider verified — must match the recipient's email.
	SubjectEmail string `json:"subjectEmail"`
}

// CreateSigningURLRequest requests a single-use embedded signing URL for one recipient. Provide
// exactly one of RecipientID or ExternalID.
type CreateSigningURLRequest struct {
	// RecipientID selects the recipient by TurboDocx recipient id...
	RecipientID string `json:"recipientId,omitempty"`
	// ExternalID ...or by the externalId you set when creating the recipient. Provide exactly one.
	ExternalID string `json:"externalId,omitempty"`
	// IdentityAssertion is required only when the recipient's mode is external_idv.
	IdentityAssertion *IdentityAssertion `json:"identityAssertion,omitempty"`
	// ReturnURL is where TurboSign returns the signer after completion (https only).
	ReturnURL string `json:"returnUrl,omitempty"`
}

// CreateSigningURLResponse is the single-use embedded signing URL and its metadata.
type CreateSigningURLResponse struct {
	// URL is the URL to open (new tab / redirect) or embed for the signer.
	URL string `json:"url"`
	// ExpiresAt is when the URL stops working (ISO 8601). Nil for otp/no-verification recipients,
	// whose link follows the document's own signing window rather than a short single-use expiry.
	ExpiresAt   *string `json:"expiresAt"`
	RecipientID string  `json:"recipientId"`
	ExternalID  string  `json:"externalId,omitempty"`
	// IdentityVerificationMode is "otp", "external_idv", "override", or "" when the recipient has
	// no verification.
	IdentityVerificationMode string `json:"identityVerificationMode,omitempty"`
	// PendingChecks are the passcode steps the signer must clear on the page (e.g. "email_otp",
	// "sms_otp"). Non-empty only for otp recipients.
	PendingChecks []string `json:"pendingChecks"`
}

// EmbeddedSigningDefaultChannel is the org-level identity-verification default channel for new
// recipients (interactive path only): "none", "email" or "sms".
type EmbeddedSigningDefaultChannel = string

// EmbeddedSigningSettings is the org's embedded-signing configuration, read via
// GetEmbeddedSigningSettings.
//
// These are the set-once, org-wide gates plus the default channel. The per-recipient identity
// mode is chosen when you create each recipient (see IdentityVerification), not here.
type EmbeddedSigningSettings struct {
	// Enabled reports that embedded signing (and OTP identity verification) is on for the org.
	Enabled bool `json:"enabled"`
	// AllowExternalIDV reports that you may assert a signer's identity with your own provider.
	AllowExternalIDV bool `json:"allowExternalIdv"`
	// AllowIdentityOverride reports that a sender may issue a link that skips identity
	// verification (development/testing).
	AllowIdentityOverride bool `json:"allowIdentityOverride"`
	// DefaultChannel is the default OTP channel applied to recipients that do not specify one, on
	// the interactive (UI) create path only. SDK/API sends must set identity per recipient, so
	// this does not affect them. "none" means no default.
	DefaultChannel EmbeddedSigningDefaultChannel `json:"defaultChannel,omitempty"`
	// AllowedFrameAncestors are the origins allowed to embed the signing page in an iframe
	// (empty = no restriction configured).
	AllowedFrameAncestors []string `json:"allowedFrameAncestors"`
}

// EmbeddedRecipientSMS carries the phone number for SMS OTP shorthand.
type EmbeddedRecipientSMS struct {
	PhoneNumber string
}

// EmbeddedRecipientAuth is the ergonomic per-recipient identity shorthand for embedded signing.
// It expands to the recipient's IdentityVerification. Leave both zero for no verification.
// EmailOTP wins if both are set.
type EmbeddedRecipientAuth struct {
	// EmailOTP requires an email OTP before signing. Maps to
	// IdentityVerification{Mode:"otp", Channel:"email"}.
	EmailOTP bool
	// SMS requires an SMS OTP to the given number. Maps to
	// IdentityVerification{Mode:"otp", Channel:"sms"} and sets the recipient's Phone.
	SMS *EmbeddedRecipientSMS
}

// EmbeddedRecipientFields is shorthand field placement by text anchor; it expands to full Field
// objects (Placement "replace" + a default size). Each value is the anchor text to replace; leave
// a field empty to skip it.
type EmbeddedRecipientFields struct {
	Signature string // anchor text, e.g. "{signature1}"
	Date      string
	Initials  string
	FullName  string
}

// EmbeddedSignatureRecipient is one signer in a CreateEmbeddedSignatureRequest.
type EmbeddedSignatureRecipient struct {
	Name  string
	Email string
	Phone string
	// SigningOrder defaults to the recipient's index + 1 (sequential) when 0. 0 is never a valid
	// 1-indexed order, so a zero value unambiguously means "use the default".
	SigningOrder int
	Auth         *EmbeddedRecipientAuth
	Fields       *EmbeddedRecipientFields
}

// CreateEmbeddedSignatureRequest creates a signature request and mints a per-recipient embed URL
// in one call.
type CreateEmbeddedSignatureRequest struct {
	// File content (use this OR FileLink/DeliverableID/TemplateID).
	File     []byte
	FileName string

	// Alternative file sources.
	FileLink      string
	DeliverableID string
	TemplateID    string

	DocumentName        string
	DocumentDescription string
	SenderName          string
	SenderEmail         string
	CCEmails            []string

	Recipients []EmbeddedSignatureRecipient
	// Fields optionally overrides the per-recipient Fields shorthand with full field control.
	Fields []Field
	// SendEmail defaults to false for this flow (the host owns the UX). Set a pointer to override.
	SendEmail *bool
	// ReturnURL is an optional completion fallback (https). Passed to each embed URL when set.
	ReturnURL string
}

// EmbeddedSignatureRecipientResult is one resolved signer in a CreateEmbeddedSignatureResponse.
type EmbeddedSignatureRecipientResult struct {
	RecipientID string
	Name        string
	Email       string
	// EmbedURL is the embeddable signing URL — present only when it is this recipient's turn
	// (Status "ready"). Empty for a recipient who cannot sign yet (Status "pending") or has
	// already signed (Status "completed"); mint it later with CreateSigningURL.
	EmbedURL string
	// Status is "ready" (their turn; EmbedURL set), "pending" (an earlier signer hasn't signed
	// yet) or "completed" (already signed).
	Status string
	// IdentityVerificationMode is "otp", "external_idv", "override", or "" when unverified.
	IdentityVerificationMode string
}

// CreateEmbeddedSignatureResponse is the document plus a per-recipient embed URL.
type CreateEmbeddedSignatureResponse struct {
	DocumentID string
	Recipients []EmbeddedSignatureRecipientResult
}

const (
	// Embedded result statuses.
	embeddedStatusReady     = "ready"
	embeddedStatusPending   = "pending"
	embeddedStatusCompleted = "completed"
)

// embeddedFieldSpec is a shorthand field key's concrete Field type plus its default size.
type embeddedFieldSpec struct {
	fieldType string
	width     int
	height    int
}

// errorCode extracts the machine-readable Code from any of the SDK's typed errors. It is a type
// switch (not errors.As) because the typed errors embed TurboDocxError by value and expose no
// Unwrap, so errors.As against *TurboDocxError would not match them. It is exhaustive over every
// typed error plus the bare *TurboDocxError so it reads the code regardless of which HTTP status
// the backend used (mapStatusToError routes anything outside its switch to *TurboDocxError).
func errorCode(err error) string {
	switch e := err.(type) {
	case *ValidationError:
		return e.Code
	case *AuthenticationError:
		return e.Code
	case *AuthorizationError:
		return e.Code
	case *NotFoundError:
		return e.Code
	case *ConflictError:
		return e.Code
	case *RateLimitError:
		return e.Code
	case *NetworkError:
		return e.Code
	case *TurboDocxError:
		return e.Code
	default:
		return ""
	}
}

// resolveIdentityVerification maps an embedded recipient's auth shorthand to a full
// IdentityVerification. EmailOTP wins if both are set. Returns nil when no auth is requested.
func resolveIdentityVerification(auth *EmbeddedRecipientAuth) *IdentityVerification {
	if auth == nil {
		return nil
	}
	if auth.EmailOTP {
		return &IdentityVerification{Mode: "otp", Channel: "email"}
	}
	if auth.SMS != nil {
		return &IdentityVerification{Mode: "otp", Channel: "sms"}
	}
	return nil
}

// expandRecipientFields expands a recipient's Fields shorthand into full Field objects — one per
// provided key, anchored to the given text with Placement "replace" and the key's default size.
//
// The keys are checked in a fixed order (not by ranging a map, whose iteration order Go
// randomizes) so the produced slice is deterministic.
func expandRecipientFields(recipient EmbeddedSignatureRecipient) []Field {
	shorthand := recipient.Fields
	if shorthand == nil {
		return nil
	}

	entries := []struct {
		anchor string
		spec   embeddedFieldSpec
	}{
		{shorthand.Signature, embeddedFieldSpec{"signature", 100, 30}},
		{shorthand.Date, embeddedFieldSpec{"date", 75, 30}},
		// "initials" shorthand maps to the "initial" field type — there is no "initials" type.
		{shorthand.Initials, embeddedFieldSpec{"initial", 50, 30}},
		{shorthand.FullName, embeddedFieldSpec{"full_name", 150, 30}},
	}

	fields := make([]Field, 0, len(entries))
	for _, e := range entries {
		if e.anchor == "" {
			continue
		}
		fields = append(fields, Field{
			Type:           e.spec.fieldType,
			RecipientEmail: recipient.Email,
			Template: &TemplateAnchor{
				Anchor:    e.anchor,
				Placement: "replace",
				Size:      &Size{Width: e.spec.width, Height: e.spec.height},
			},
		})
	}
	return fields
}

// CreateSigningURL mints a single-use embedded signing URL for one recipient — request it the
// moment the signer is ready (never store it). The Go counterpart of the JS SDK's createSigningUrl.
//
// Provide exactly one of RecipientID or ExternalID (both or neither is a client-side
// ValidationError). IdentityAssertion is only for external_idv recipients; ReturnURL, when set,
// must be an https URL.
func (c *TurboSignClient) CreateSigningURL(ctx context.Context, documentID string, req *CreateSigningURLRequest) (*CreateSigningURLResponse, error) {
	// Fail fast with actionable messages; the server still enforces everything.
	selectorCount := 0
	if req.RecipientID != "" {
		selectorCount++
	}
	if req.ExternalID != "" {
		selectorCount++
	}
	if selectorCount != 1 {
		return nil, &ValidationError{TurboDocxError: TurboDocxError{
			Code:       "RecipientSelectorInvalid",
			Message:    "Provide exactly one of RecipientID or ExternalID to CreateSigningURL.",
			StatusCode: 400,
		}}
	}
	if req.ReturnURL != "" && !strings.HasPrefix(strings.ToLower(req.ReturnURL), "https://") {
		return nil, &ValidationError{TurboDocxError: TurboDocxError{
			Code:       "InvalidReturnUrl",
			Message:    "ReturnURL must be an https URL.",
			StatusCode: 400,
		}}
	}

	// The endpoint replies { data: { results } }. The HTTP client strips the outer `data`, so a
	// `results` envelope remains — unwrap it here (same convention as the quote/deliverable
	// modules). Returning the outer envelope instead of results is the js-sdk wrong-level bug;
	// don't repeat it.
	var envelope struct {
		Results CreateSigningURLResponse `json:"results"`
	}
	if err := c.http.Post(ctx, "/turbosign/documents/"+documentID+"/signing-url", req, &envelope); err != nil {
		return nil, err
	}
	return &envelope.Results, nil
}

// GetEmbeddedSigningSettings reads the org's embedded-signing settings: the set-once, org-wide
// gates (embedded signing enabled, external identity verification allowed, override allowed), the
// default OTP channel, and the allowed iframe embedding origins. Read-only.
func (c *TurboSignClient) GetEmbeddedSigningSettings(ctx context.Context) (*EmbeddedSigningSettings, error) {
	// { data: { results } } envelope, same as CreateSigningURL above.
	var envelope struct {
		Results EmbeddedSigningSettings `json:"results"`
	}
	if err := c.http.Get(ctx, "/turbosign/embedded-signing-settings", &envelope); err != nil {
		return nil, err
	}
	return &envelope.Results, nil
}

// CreateEmbeddedSignature creates a signature request AND mints a per-recipient embedded signing
// URL in one call — the embedded-signing counterpart of DocuSeal's create-with-embed and Dropbox
// Sign's embedded flow. It is a thin WRAPPER over SendSignature + CreateSigningURL (no new
// endpoint), mapping the ergonomic request (per-recipient Auth + Fields shorthand) onto those
// calls, then assembling a per-recipient result carrying the embed URL and resolved identity mode.
//
// Mapping:
//   - Auth.EmailOTP → IdentityVerification{Mode:"otp", Channel:"email"};
//     Auth.SMS.PhoneNumber → {Mode:"otp", Channel:"sms"} and sets the recipient's Phone.
//   - Fields shorthand → []Field (Placement "replace" + a default size). Provide the top-level
//     Fields to override the shorthand with full field control.
//   - SigningOrder defaults to each recipient's index + 1.
//   - SendEmail defaults to false (you own the UX; forwarded to the backend).
//   - ReturnURL is passed through to each embed URL only when provided.
//
// Turn-aware: with a real (sequential) signing order the backend only mints a URL for the signer
// whose turn it is. Rather than throw the whole call away, each result carries a Status:
//   - "ready": it's their turn; EmbedURL is set, frame it now.
//   - "pending": an earlier signer hasn't finished; EmbedURL is empty. Re-mint with
//     CreateSigningURL once earlier signers complete.
//   - "completed": they've already signed; EmbedURL is empty.
//
// A genuine error (anything other than not-in-turn / already-signed) still returns.
func (c *TurboSignClient) CreateEmbeddedSignature(ctx context.Context, req *CreateEmbeddedSignatureRequest) (*CreateEmbeddedSignatureResponse, error) {
	// 1. Map the ergonomic recipients onto full Recipient objects (identity + phone + order).
	mappedRecipients := make([]Recipient, 0, len(req.Recipients))
	for i, r := range req.Recipients {
		identity := resolveIdentityVerification(r.Auth)
		phone := r.Phone
		if r.Auth != nil && r.Auth.SMS != nil {
			phone = r.Auth.SMS.PhoneNumber
		}
		order := r.SigningOrder
		if order == 0 {
			order = i + 1
		}
		mappedRecipients = append(mappedRecipients, Recipient{
			Name:                 r.Name,
			Email:                r.Email,
			SigningOrder:         order,
			Phone:                phone,
			IdentityVerification: identity,
		})
	}

	// Client-side fail-fast: an SMS OTP recipient with no resolved phone. The other identity
	// modes are unreachable from this shorthand (Auth only ever produces email/sms OTP), so only
	// this check is live; the server remains the source of truth.
	for _, r := range mappedRecipients {
		if r.IdentityVerification != nil && r.IdentityVerification.Mode == "otp" &&
			r.IdentityVerification.Channel == "sms" && r.Phone == "" {
			return nil, &ValidationError{TurboDocxError: TurboDocxError{
				Code:       "PhoneRequiredForSmsOtp",
				Message:    fmt.Sprintf("Recipient %q uses SMS OTP but has no phone (E.164).", r.Email),
				StatusCode: 400,
			}}
		}
	}

	// Full Fields (when provided) win verbatim; otherwise expand each recipient's shorthand.
	fields := req.Fields
	if fields == nil {
		for _, r := range req.Recipients {
			fields = append(fields, expandRecipientFields(r)...)
		}
	}

	// Embedded flow default: suppress recipient emails (the host owns the UX).
	sendEmail := req.SendEmail
	if sendEmail == nil {
		defaultSend := false
		sendEmail = &defaultSend
	}

	sent, err := c.SendSignature(ctx, &SendSignatureRequest{
		Recipients:          mappedRecipients,
		Fields:              fields,
		SendEmail:           sendEmail,
		File:                req.File,
		FileName:            req.FileName,
		FileLink:            req.FileLink,
		TemplateID:          req.TemplateID,
		DeliverableID:       req.DeliverableID,
		DocumentName:        req.DocumentName,
		DocumentDescription: req.DocumentDescription,
		SenderName:          req.SenderName,
		SenderEmail:         req.SenderEmail,
		CCEmails:            req.CCEmails,
	})
	if err != nil {
		return nil, err
	}

	// Match the backend's recipients back to the request by email so we can carry Name and know
	// the resolved identity mode. The response's recipients is optional, so guard it.
	recipientIDByEmail := make(map[string]string, len(sent.Recipients))
	for _, sr := range sent.Recipients {
		recipientIDByEmail[sr.Email] = sr.ID
	}

	// 2 + 3. Mint one embed URL per recipient and assemble the result IN SIGNING ORDER. Use a
	// stable sort so recipients sharing an order keep their request order (JS .sort() is stable).
	type orderedRecipient struct {
		recipient EmbeddedSignatureRecipient
		order     int
	}
	ordered := make([]orderedRecipient, 0, len(req.Recipients))
	for i, r := range req.Recipients {
		order := r.SigningOrder
		if order == 0 {
			order = i + 1
		}
		ordered = append(ordered, orderedRecipient{recipient: r, order: order})
	}
	sort.SliceStable(ordered, func(a, b int) bool { return ordered[a].order < ordered[b].order })

	results := make([]EmbeddedSignatureRecipientResult, 0, len(ordered))
	for _, o := range ordered {
		r := o.recipient
		recipientID, ok := recipientIDByEmail[r.Email]
		if !ok {
			return nil, &ValidationError{TurboDocxError: TurboDocxError{
				Code:       "EmbeddedRecipientNotReturned",
				Message:    fmt.Sprintf("SendSignature did not return a recipient matching %q; cannot mint an embed URL.", r.Email),
				StatusCode: 400,
			}}
		}

		// Turn-aware: for a real signing order the backend refuses to mint a URL for a signer
		// whose turn hasn't come (RecipientNotInTurn / NotSignersTurn) or who already signed
		// (RecipientAlreadySigned). Those are expected states, not failures — degrade to an empty
		// URL + status so the caller can mint the URL later. Any OTHER error propagates.
		signingReq := &CreateSigningURLRequest{RecipientID: recipientID}
		if req.ReturnURL != "" {
			signingReq.ReturnURL = req.ReturnURL
		}
		link, err := c.CreateSigningURL(ctx, sent.DocumentID, signingReq)
		if err != nil {
			code := errorCode(err)
			if code != "RecipientNotInTurn" && code != "NotSignersTurn" && code != "RecipientAlreadySigned" {
				return nil, err
			}
			status := embeddedStatusPending
			if code == "RecipientAlreadySigned" {
				status = embeddedStatusCompleted
			}
			mode := ""
			if iv := resolveIdentityVerification(r.Auth); iv != nil {
				mode = iv.Mode
			}
			results = append(results, EmbeddedSignatureRecipientResult{
				RecipientID:              recipientID,
				Name:                     r.Name,
				Email:                    r.Email,
				EmbedURL:                 "",
				Status:                   status,
				IdentityVerificationMode: mode,
			})
			continue
		}

		results = append(results, EmbeddedSignatureRecipientResult{
			RecipientID:              recipientID,
			Name:                     r.Name,
			Email:                    r.Email,
			EmbedURL:                 link.URL,
			Status:                   embeddedStatusReady,
			IdentityVerificationMode: link.IdentityVerificationMode,
		})
	}

	return &CreateEmbeddedSignatureResponse{
		DocumentID: sent.DocumentID,
		Recipients: results,
	}, nil
}
