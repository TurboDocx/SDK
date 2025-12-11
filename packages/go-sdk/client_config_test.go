package turbodocx

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test senderEmail validation
func TestClientConfig_SenderEmailValidation(t *testing.T) {
	t.Run("should throw ValidationError when senderEmail is not provided", func(t *testing.T) {
		_, err := NewClientWithConfig(ClientConfig{
			APIKey: "test-api-key",
			OrgID:  "test-org-id",
			// senderEmail intentionally missing
		})

		require.Error(t, err)
		validationErr, ok := err.(*ValidationError)
		require.True(t, ok, "expected ValidationError")
		assert.Contains(t, validationErr.Message, "SenderEmail is required")
		assert.Contains(t, validationErr.Message, "reply-to address")
		assert.Equal(t, 400, validationErr.StatusCode)
	})

	t.Run("should accept valid senderEmail", func(t *testing.T) {
		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
		})

		require.NoError(t, err)
		assert.NotNil(t, client)
		senderEmail, _ := client.httpClient.GetSenderConfig()
		assert.Equal(t, "support@company.com", senderEmail)
	})

	t.Run("should read senderEmail from environment variable", func(t *testing.T) {
		os.Setenv("TURBODOCX_SENDER_EMAIL", "env@company.com")
		os.Setenv("TURBODOCX_API_KEY", "test-api-key")
		os.Setenv("TURBODOCX_ORG_ID", "test-org-id")
		defer func() {
			os.Unsetenv("TURBODOCX_SENDER_EMAIL")
			os.Unsetenv("TURBODOCX_API_KEY")
			os.Unsetenv("TURBODOCX_ORG_ID")
		}()

		client, err := NewClientWithConfig(ClientConfig{})

		require.NoError(t, err)
		assert.NotNil(t, client)
		senderEmail, _ := client.httpClient.GetSenderConfig()
		assert.Equal(t, "env@company.com", senderEmail)
	})

	t.Run("should prioritize explicit senderEmail over environment variable", func(t *testing.T) {
		os.Setenv("TURBODOCX_SENDER_EMAIL", "env@company.com")
		defer os.Unsetenv("TURBODOCX_SENDER_EMAIL")

		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "explicit@company.com",
		})

		require.NoError(t, err)
		senderEmail, _ := client.httpClient.GetSenderConfig()
		assert.Equal(t, "explicit@company.com", senderEmail)
	})
}

// Test senderName configuration
func TestClientConfig_SenderNameConfiguration(t *testing.T) {
	t.Run("should accept configuration without senderName", func(t *testing.T) {
		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
			// senderName intentionally omitted
		})

		require.NoError(t, err)
		assert.NotNil(t, client)
		_, senderName := client.httpClient.GetSenderConfig()
		assert.Equal(t, "", senderName)
	})

	t.Run("should accept configuration with senderName", func(t *testing.T) {
		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
			SenderName:  "Support Team",
		})

		require.NoError(t, err)
		assert.NotNil(t, client)
		_, senderName := client.httpClient.GetSenderConfig()
		assert.Equal(t, "Support Team", senderName)
	})

	t.Run("should read senderName from environment variable", func(t *testing.T) {
		os.Setenv("TURBODOCX_SENDER_NAME", "Env Support Team")
		os.Setenv("TURBODOCX_SENDER_EMAIL", "env@company.com")
		os.Setenv("TURBODOCX_API_KEY", "test-api-key")
		os.Setenv("TURBODOCX_ORG_ID", "test-org-id")
		defer func() {
			os.Unsetenv("TURBODOCX_SENDER_NAME")
			os.Unsetenv("TURBODOCX_SENDER_EMAIL")
			os.Unsetenv("TURBODOCX_API_KEY")
			os.Unsetenv("TURBODOCX_ORG_ID")
		}()

		client, err := NewClientWithConfig(ClientConfig{})

		require.NoError(t, err)
		_, senderName := client.httpClient.GetSenderConfig()
		assert.Equal(t, "Env Support Team", senderName)
	})

	t.Run("should prioritize explicit senderName over environment variable", func(t *testing.T) {
		os.Setenv("TURBODOCX_SENDER_NAME", "Env Support")
		defer os.Unsetenv("TURBODOCX_SENDER_NAME")

		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
			SenderName:  "Explicit Support",
		})

		require.NoError(t, err)
		_, senderName := client.httpClient.GetSenderConfig()
		assert.Equal(t, "Explicit Support", senderName)
	})
}

// Test complete configuration combinations
func TestClientConfig_CompleteConfiguration(t *testing.T) {
	t.Run("should require API key or access token", func(t *testing.T) {
		_, err := NewClientWithConfig(ClientConfig{
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
			// APIKey and AccessToken intentionally missing
		})

		require.Error(t, err)
		assert.Contains(t, err.Error(), "API key or access token is required")
	})

	t.Run("should require orgId", func(t *testing.T) {
		_, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			SenderEmail: "support@company.com",
			// OrgID intentionally missing
		})

		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Contains(t, authErr.Message, "Organization ID")
		assert.Equal(t, 401, authErr.StatusCode)
	})

	t.Run("should accept full configuration with API key", func(t *testing.T) {
		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
			SenderName:  "Support Team",
			BaseURL:     "https://custom.api.com",
		})

		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.NotNil(t, client.TurboSign)
		senderEmail, senderName := client.httpClient.GetSenderConfig()
		assert.Equal(t, "support@company.com", senderEmail)
		assert.Equal(t, "Support Team", senderName)
	})

	t.Run("should accept access token instead of API key", func(t *testing.T) {
		client, err := NewClientWithConfig(ClientConfig{
			AccessToken: "test-access-token",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
		})

		require.NoError(t, err)
		assert.NotNil(t, client)
	})

	t.Run("should use default base URL when not provided", func(t *testing.T) {
		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
		})

		require.NoError(t, err)
		assert.NotNil(t, client)
	})
}

// Test GetSenderConfig method
func TestClientConfig_GetSenderConfig(t *testing.T) {
	t.Run("should return both senderEmail and senderName", func(t *testing.T) {
		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
			SenderName:  "Support Team",
		})

		senderEmail, senderName := client.httpClient.GetSenderConfig()
		assert.Equal(t, "support@company.com", senderEmail)
		assert.Equal(t, "Support Team", senderName)
	})

	t.Run("should return senderEmail and empty senderName when name not provided", func(t *testing.T) {
		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "support@company.com",
		})

		senderEmail, senderName := client.httpClient.GetSenderConfig()
		assert.Equal(t, "support@company.com", senderEmail)
		assert.Equal(t, "", senderName)
	})
}
