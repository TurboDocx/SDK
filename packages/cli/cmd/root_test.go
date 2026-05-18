package cmd

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfigResolutionPriority(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.json")
	cfg := &config.Config{
		APIKey:      "file-key",
		OrgID:       "file-org",
		SenderEmail: "file@example.com",
	}
	err := config.Save(cfgPath, cfg)
	require.NoError(t, err)

	// Env vars should override file values when no flags are passed
	t.Setenv("TURBODOCX_API_KEY", "env-key")
	t.Setenv("TURBODOCX_ORG_ID", "env-org")

	// All flag params empty — env should win over file
	resolved := resolveConfig(cfgPath, "", "", "", "", "", "", "")
	assert.Equal(t, "env-key", resolved.APIKey, "env should override file")
	assert.Equal(t, "env-org", resolved.OrgID, "env should override file")
}

func TestFlagOverridesEnvAndFile(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.json")
	cfg := &config.Config{APIKey: "file-key", OrgID: "file-org", SenderEmail: "file@test.com"}
	err := config.Save(cfgPath, cfg)
	require.NoError(t, err)

	t.Setenv("TURBODOCX_API_KEY", "env-key")

	// resolveConfig(cfgPath, apiKey, orgID, senderEmail, senderName, baseURL, partnerAPIKey, partnerID)
	resolved := resolveConfig(cfgPath, "flag-key", "flag-org", "flag@test.com", "Flag Name", "", "", "")
	assert.Equal(t, "flag-key", resolved.APIKey, "flag should override env and file")
	assert.Equal(t, "flag-org", resolved.OrgID, "flag should override file")
	assert.Equal(t, "flag@test.com", resolved.SenderEmail)
	assert.Equal(t, "Flag Name", resolved.SenderName)
}

func TestConfigFromFileOnly(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.json")
	cfg := &config.Config{
		APIKey:      "file-key",
		OrgID:       "file-org",
		SenderEmail: "file@test.com",
		SenderName:  "File Name",
		BaseURL:     "https://custom.api.com",
	}
	err := config.Save(cfgPath, cfg)
	require.NoError(t, err)

	os.Unsetenv("TURBODOCX_API_KEY")
	os.Unsetenv("TURBODOCX_ORG_ID")
	os.Unsetenv("TURBODOCX_SENDER_EMAIL")

	resolved := resolveConfig(cfgPath, "", "", "", "", "", "", "")
	assert.Equal(t, "file-key", resolved.APIKey)
	assert.Equal(t, "file-org", resolved.OrgID)
	assert.Equal(t, "file@test.com", resolved.SenderEmail)
	assert.Equal(t, "File Name", resolved.SenderName)
	assert.Equal(t, "https://custom.api.com", resolved.BaseURL)
}

func TestJSONAndPlainFlags(t *testing.T) {
	assert.False(t, jsonOutput)
	assert.False(t, plainOutput)
}
