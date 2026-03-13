package output

import (
	"bytes"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPrintJSON(t *testing.T) {
	var buf bytes.Buffer
	data := map[string]string{"status": "completed", "id": "doc-123"}

	err := PrintJSON(&buf, data)
	require.NoError(t, err)

	var parsed map[string]string
	err = json.Unmarshal(buf.Bytes(), &parsed)
	require.NoError(t, err)
	assert.Equal(t, "completed", parsed["status"])
	assert.Equal(t, "doc-123", parsed["id"])
}

func TestPrintTable(t *testing.T) {
	var buf bytes.Buffer
	headers := []string{"ID", "Status", "Date"}
	rows := [][]string{
		{"doc-1", "completed", "2024-01-01"},
		{"doc-2", "pending", "2024-01-02"},
	}

	PrintTable(&buf, headers, rows)

	output := buf.String()
	assert.Contains(t, output, "ID")
	assert.Contains(t, output, "Status")
	assert.Contains(t, output, "doc-1")
	assert.Contains(t, output, "completed")
	assert.Contains(t, output, "doc-2")
	assert.Contains(t, output, "pending")
}

func TestPrintKeyValue(t *testing.T) {
	var buf bytes.Buffer
	pairs := []KeyValue{
		{Key: "Document ID", Value: "doc-123"},
		{Key: "Status", Value: "completed"},
	}

	PrintKeyValue(&buf, pairs)

	output := buf.String()
	assert.Contains(t, output, "Document ID")
	assert.Contains(t, output, "doc-123")
	assert.Contains(t, output, "Status")
	assert.Contains(t, output, "completed")
}

func TestPrintError(t *testing.T) {
	var buf bytes.Buffer
	PrintError(&buf, "something went wrong")

	output := buf.String()
	assert.Contains(t, output, "something went wrong")
	assert.Contains(t, output, "Error")
}

func TestPrintErrorJSON(t *testing.T) {
	var buf bytes.Buffer
	PrintErrorJSON(&buf, "something went wrong")

	var parsed map[string]string
	err := json.Unmarshal(buf.Bytes(), &parsed)
	require.NoError(t, err)
	assert.Equal(t, "something went wrong", parsed["error"])
}

func TestPrintSuccess(t *testing.T) {
	var buf bytes.Buffer
	PrintSuccess(&buf, "operation completed")

	output := buf.String()
	assert.Contains(t, output, "operation completed")
}

func TestColorDisabled(t *testing.T) {
	var buf bytes.Buffer
	PrintSuccess(&buf, "test message")
	output := buf.String()
	// Plain mode should not contain ANSI codes
	assert.NotContains(t, output, "\033[")
}

func TestColorEnabled(t *testing.T) {
	result := Green("success")
	assert.Contains(t, result, "success")
	assert.Contains(t, result, "\033[32m")

	result = Red("error")
	assert.Contains(t, result, "error")
	assert.Contains(t, result, "\033[31m")

	result = Yellow("warning")
	assert.Contains(t, result, "warning")
	assert.Contains(t, result, "\033[33m")

	result = Bold("important")
	assert.Contains(t, result, "important")
	assert.Contains(t, result, "\033[1m")
}
