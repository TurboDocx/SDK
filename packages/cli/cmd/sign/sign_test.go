package sign

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseJSONOrFileInlineJSON(t *testing.T) {
	var recipients []map[string]interface{}
	err := parseJSONOrFile(`[{"name":"John","email":"john@test.com"}]`, &recipients)
	require.NoError(t, err)
	assert.Len(t, recipients, 1)
	assert.Equal(t, "John", recipients[0]["name"])
}

func TestParseJSONOrFileFromFile(t *testing.T) {
	dir := t.TempDir()
	filePath := filepath.Join(dir, "recipients.json")
	err := os.WriteFile(filePath, []byte(`[{"name":"Jane","email":"jane@test.com"}]`), 0644)
	require.NoError(t, err)

	var recipients []map[string]interface{}
	err = parseJSONOrFile("@"+filePath, &recipients)
	require.NoError(t, err)
	assert.Len(t, recipients, 1)
	assert.Equal(t, "Jane", recipients[0]["name"])
}

func TestParseJSONOrFileMissingFile(t *testing.T) {
	var result interface{}
	err := parseJSONOrFile("@/nonexistent/file.json", &result)
	assert.Error(t, err)
}

func TestParseJSONOrFileInvalidJSON(t *testing.T) {
	var result interface{}
	err := parseJSONOrFile("not-json", &result)
	assert.Error(t, err)
}

func TestNewSignClientMissingCredentials(t *testing.T) {
	_, err := newSignClient(&config.Config{})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "API key")

	_, err = newSignClient(&config.Config{APIKey: "key"})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "Organization ID")

	_, err = newSignClient(&config.Config{APIKey: "key", OrgID: "org"})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "Sender email")
}
