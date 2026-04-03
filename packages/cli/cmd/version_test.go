package cmd

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVersionHumanOutput(t *testing.T) {
	SetVersionInfo("1.2.3", "abc123")
	jsonOutput = false

	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{"version"})
	err := rootCmd.Execute()
	require.NoError(t, err)

	output := buf.String()
	assert.Contains(t, output, "1.2.3")
	assert.Contains(t, output, "abc123")
}

func TestVersionJSONOutput(t *testing.T) {
	SetVersionInfo("1.2.3", "abc123")
	jsonOutput = true
	defer func() { jsonOutput = false }()

	var buf bytes.Buffer
	rootCmd.SetOut(&buf)
	rootCmd.SetErr(&buf)
	rootCmd.SetArgs([]string{"version"})
	err := rootCmd.Execute()
	require.NoError(t, err)

	var parsed map[string]string
	err = json.Unmarshal(buf.Bytes(), &parsed)
	require.NoError(t, err)
	assert.Equal(t, "1.2.3", parsed["version"])
	assert.Equal(t, "abc123", parsed["commit"])
	assert.NotEmpty(t, parsed["os"])
	assert.NotEmpty(t, parsed["arch"])
	assert.NotEmpty(t, parsed["go"])
}
