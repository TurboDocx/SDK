package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadMissingFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "nonexistent", "config.json")

	cfg, err := Load(path)
	require.NoError(t, err)
	assert.Equal(t, &Config{}, cfg, "missing file should return zero config")
}

func TestSaveCreatesDirectoryAndFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "subdir", "config.json")

	cfg := &Config{
		APIKey:      "test-key",
		OrgID:       "test-org",
		SenderEmail: "test@example.com",
		SenderName:  "Test User",
		BaseURL:     "https://custom.api.com",
	}

	err := Save(path, cfg)
	require.NoError(t, err)

	// Verify directory permissions
	info, err := os.Stat(filepath.Dir(path))
	require.NoError(t, err)
	assert.Equal(t, os.FileMode(0700), info.Mode().Perm(), "directory should be 0700")

	// Verify file permissions
	info, err = os.Stat(path)
	require.NoError(t, err)
	assert.Equal(t, os.FileMode(0600), info.Mode().Perm(), "file should be 0600")
}

func TestRoundTrip(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	original := &Config{
		APIKey:        "api-key-123",
		OrgID:         "org-456",
		SenderEmail:   "sender@example.com",
		SenderName:    "Sender Name",
		BaseURL:       "https://api.example.com",
		PartnerAPIKey: "TDXP-partner-key",
		PartnerID:     "partner-789",
	}

	err := Save(path, original)
	require.NoError(t, err)

	loaded, err := Load(path)
	require.NoError(t, err)
	assert.Equal(t, original, loaded)
}

func TestSaveWritesValidJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	cfg := &Config{APIKey: "test"}
	err := Save(path, cfg)
	require.NoError(t, err)

	data, err := os.ReadFile(path)
	require.NoError(t, err)

	var parsed map[string]interface{}
	err = json.Unmarshal(data, &parsed)
	assert.NoError(t, err, "saved file should be valid JSON")
}

func TestDefaultPath(t *testing.T) {
	path := DefaultPath()
	assert.Contains(t, path, ".turbodocx")
	assert.Contains(t, path, "config.json")
}

func TestValidKeys(t *testing.T) {
	keys := ValidKeys()
	assert.Contains(t, keys, "apiKey")
	assert.Contains(t, keys, "orgId")
	assert.Contains(t, keys, "senderEmail")
	assert.Contains(t, keys, "senderName")
	assert.Contains(t, keys, "baseUrl")
	assert.Contains(t, keys, "partnerApiKey")
	assert.Contains(t, keys, "partnerId")
}

func TestGetSetField(t *testing.T) {
	cfg := &Config{}

	tests := []struct {
		key   string
		value string
	}{
		{"apiKey", "key-123"},
		{"orgId", "org-456"},
		{"senderEmail", "test@test.com"},
		{"senderName", "Test"},
		{"baseUrl", "https://api.test.com"},
		{"partnerApiKey", "TDXP-key"},
		{"partnerId", "pid-123"},
	}

	for _, tt := range tests {
		err := cfg.Set(tt.key, tt.value)
		require.NoError(t, err)

		val, err := cfg.Get(tt.key)
		require.NoError(t, err)
		assert.Equal(t, tt.value, val)
	}
}

func TestSetInvalidKey(t *testing.T) {
	cfg := &Config{}
	err := cfg.Set("invalidKey", "value")
	assert.Error(t, err)
}

func TestGetInvalidKey(t *testing.T) {
	cfg := &Config{}
	_, err := cfg.Get("invalidKey")
	assert.Error(t, err)
}
