// Package turbodocx provides the official Go SDK for TurboDocx API.
//
// This SDK provides digital signatures, document generation, and AI-powered workflows.
//
// Example usage:
//
//	client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
//		APIKey: "your-api-key",
//		OrgID:  "your-org-id",
//	})
//
//	// Prepare document for signing
//	result, err := client.TurboSign.SendSignature(ctx, &turbodocx.SendSignatureRequest{
//		FileLink: "https://example.com/contract.pdf",
//		Recipients: []turbodocx.Recipient{
//			{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
//		},
//		Fields: []turbodocx.Field{
//			{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
//		},
//	})
package turbodocx

import (
	"errors"
	"os"
)

// Version is the current SDK version
const Version = "0.1.0"

// Client is the main TurboDocx API client
type Client struct {
	// TurboSign provides digital signature operations
	TurboSign *TurboSignClient

	// TurboTemplate provides document templating operations
	TurboTemplate *TurboTemplateClient

	httpClient *HTTPClient
}

// ClientConfig holds configuration options for the client
type ClientConfig struct {
	// APIKey is your TurboDocx API key (required)
	APIKey string

	// OrgID is your Organization ID (required)
	OrgID string

	// AccessToken is an OAuth2 access token (alternative to APIKey)
	AccessToken string

	// BaseURL is the API base URL (optional, default: https://api.turbodocx.com)
	BaseURL string

	// SenderEmail is the reply-to email address for signature requests (required).
	// This email will be used as the reply-to address when sending signature request emails.
	// Without it, emails will default to "API Service User via TurboSign".
	SenderEmail string

	// SenderName is the sender name for signature requests (optional but strongly recommended).
	// This name will appear in signature request emails. Without this, the sender will
	// appear as "API Service User".
	SenderName string
}

// NewClient creates a new TurboDocx client with the given API key and org ID
func NewClient(apiKey, orgID string) (*Client, error) {
	return NewClientWithConfig(ClientConfig{
		APIKey: apiKey,
		OrgID:  orgID,
	})
}

// NewClientWithConfig creates a new TurboDocx client with custom configuration
func NewClientWithConfig(config ClientConfig) (*Client, error) {
	// Read from environment variables if not provided in config
	if config.APIKey == "" {
		config.APIKey = os.Getenv("TURBODOCX_API_KEY")
	}
	if config.AccessToken == "" {
		config.AccessToken = os.Getenv("TURBODOCX_ACCESS_TOKEN")
	}
	if config.OrgID == "" {
		config.OrgID = os.Getenv("TURBODOCX_ORG_ID")
	}
	if config.SenderEmail == "" {
		config.SenderEmail = os.Getenv("TURBODOCX_SENDER_EMAIL")
	}
	if config.SenderName == "" {
		config.SenderName = os.Getenv("TURBODOCX_SENDER_NAME")
	}
	if config.BaseURL == "" {
		config.BaseURL = "https://api.turbodocx.com"
	}

	if config.APIKey == "" && config.AccessToken == "" {
		return nil, errors.New("API key or access token is required")
	}

	if config.OrgID == "" {
		return nil, &AuthenticationError{
			TurboDocxError: TurboDocxError{
				Message:    "Organization ID (OrgID) is required for authentication",
				StatusCode: 401,
			},
		}
	}

	// Note: SenderEmail validation removed - it's only required for TurboSign operations

	httpClient := NewHTTPClient(config)

	return &Client{
		TurboSign:     NewTurboSignClient(httpClient),
		TurboTemplate: &TurboTemplateClient{httpClient: httpClient},
		httpClient:    httpClient,
	}, nil
}
