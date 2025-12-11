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

import "errors"

// Version is the current SDK version
const Version = "0.1.0"

// Client is the main TurboDocx API client
type Client struct {
	// TurboSign provides digital signature operations
	TurboSign *TurboSignClient

	httpClient *HTTPClient
}

// ClientConfig holds configuration options for the client
type ClientConfig struct {
	// APIKey is your TurboDocx API key
	APIKey string

	// OrgID is your Organization ID (required for authentication)
	OrgID string

	// AccessToken is an OAuth2 access token (alternative to APIKey)
	AccessToken string

	// BaseURL is the API base URL (default: https://api.turbodocx.com)
	BaseURL string
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

	httpClient := NewHTTPClient(config)

	return &Client{
		TurboSign:  NewTurboSignClient(httpClient),
		httpClient: httpClient,
	}, nil
}
