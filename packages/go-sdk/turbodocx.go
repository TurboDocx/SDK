// Package turbodocx provides the official Go SDK for TurboDocx API.
//
// This SDK provides digital signatures, document generation, and AI-powered workflows.
//
// Example usage:
//
//	client := turbodocx.NewClient("your-api-key")
//
//	// Prepare document for signing
//	result, err := client.TurboSign.PrepareForSigningSingle(ctx, &turbodocx.PrepareForSigningRequest{
//		FileLink: "https://example.com/contract.pdf",
//		Recipients: []turbodocx.Recipient{
//			{Name: "John Doe", Email: "john@example.com", Order: 1},
//		},
//		Fields: []turbodocx.Field{
//			{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
//		},
//	})
package turbodocx

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

	// AccessToken is an OAuth2 access token (alternative to APIKey)
	AccessToken string

	// BaseURL is the API base URL (default: https://api.turbodocx.com)
	BaseURL string
}

// NewClient creates a new TurboDocx client with the given API key
func NewClient(apiKey string) *Client {
	return NewClientWithConfig(ClientConfig{APIKey: apiKey})
}

// NewClientWithConfig creates a new TurboDocx client with custom configuration
func NewClientWithConfig(config ClientConfig) *Client {
	if config.BaseURL == "" {
		config.BaseURL = "https://api.turbodocx.com"
	}

	httpClient := NewHTTPClient(config)

	return &Client{
		TurboSign:  NewTurboSignClient(httpClient),
		httpClient: httpClient,
	}
}
