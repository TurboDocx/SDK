package cmd

import (
	"bytes"
	"path/filepath"
	"testing"

	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoginNonInteractive(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.json")
	flagConfigPath = cfgPath

	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{
		"login",
		"--api-key", "test-api-key",
		"--org-id", "test-org-id",
		"--sender-email", "test@example.com",
		"--sender-name", "Test User",
	})

	err := rootCmd.Execute()
	require.NoError(t, err)

	cfg, err := config.Load(cfgPath)
	require.NoError(t, err)
	assert.Equal(t, "test-api-key", cfg.APIKey)
	assert.Equal(t, "test-org-id", cfg.OrgID)
	assert.Equal(t, "test@example.com", cfg.SenderEmail)
	assert.Equal(t, "Test User", cfg.SenderName)
}

func TestLoginRequiresAPIKeyNonInteractive(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.json")
	flagConfigPath = cfgPath

	// Test the RunE function directly to avoid flag state leakage
	flagAPIKey = ""
	flagOrgID = "test-org"
	flagSenderEmail = "test@example.com"
	defer func() {
		flagAPIKey = ""
		flagOrgID = ""
		flagSenderEmail = ""
	}()

	// Simulate Changed by setting the flags
	rootCmd.PersistentFlags().Set("org-id", "test-org")
	rootCmd.PersistentFlags().Set("sender-email", "test@example.com")
	// api-key not set — should trigger error

	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{"login", "--org-id", "test-org", "--sender-email", "test@example.com"})

	err := rootCmd.Execute()
	assert.Error(t, err, "login without api-key should fail in non-interactive mode")
	if err != nil {
		assert.Contains(t, err.Error(), "api-key")
	}
}

func TestLoginCreatesConfigFile(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "subdir", "config.json")
	flagConfigPath = cfgPath

	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{
		"login",
		"--api-key", "key-123",
		"--org-id", "org-456",
		"--sender-email", "user@test.com",
	})

	err := rootCmd.Execute()
	require.NoError(t, err)

	cfg, err := config.Load(cfgPath)
	require.NoError(t, err)
	assert.Equal(t, "key-123", cfg.APIKey)
}
