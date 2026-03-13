package cmd

import (
	"bytes"
	"path/filepath"
	"testing"

	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfigSetGetRoundTrip(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.json")
	flagConfigPath = cfgPath

	// Set a value
	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{"config", "set", "apiKey", "my-secret-key"})
	err := rootCmd.Execute()
	require.NoError(t, err)

	// Get it back
	buf.Reset()
	rootCmd.SetArgs([]string{"config", "get", "apiKey"})
	err = rootCmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, buf.String(), "my-secret-key")
}

func TestConfigListMasksAPIKeys(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.json")
	flagConfigPath = cfgPath

	cfg := &config.Config{
		APIKey:        "super-secret-api-key-12345",
		OrgID:         "org-123",
		PartnerAPIKey: "TDXP-partner-key-67890",
	}
	err := config.Save(cfgPath, cfg)
	require.NoError(t, err)

	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{"config", "list"})
	err = rootCmd.Execute()
	require.NoError(t, err)

	output := buf.String()
	assert.NotContains(t, output, "super-secret-api-key-12345")
	assert.Contains(t, output, "****2345")
	assert.NotContains(t, output, "TDXP-partner-key-67890")
	assert.Contains(t, output, "****7890")
	assert.Contains(t, output, "org-123")
}

func TestConfigPath(t *testing.T) {
	dir := t.TempDir()
	cfgPath := filepath.Join(dir, "config.json")
	flagConfigPath = cfgPath

	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{"config", "path"})
	err := rootCmd.Execute()
	require.NoError(t, err)
	assert.Contains(t, buf.String(), cfgPath)
}

func TestConfigSetInvalidKey(t *testing.T) {
	dir := t.TempDir()
	flagConfigPath = filepath.Join(dir, "config.json")

	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{"config", "set", "invalidKey", "value"})
	err := rootCmd.Execute()
	assert.Error(t, err)
}
