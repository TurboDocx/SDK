package sign

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDownloadDefaultFilename(t *testing.T) {
	dir := t.TempDir()
	oldWd, _ := os.Getwd()
	os.Chdir(dir)
	defer os.Chdir(oldWd)

	mock := &mockSignClient{
		downloadFn: func(ctx context.Context, id string) ([]byte, error) {
			return []byte("content"), nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		// No --output flag, should default to <docId>.pdf
		buf, err := executeSignCmd([]string{"download", "doc-456"})
		require.NoError(t, err)

		_, statErr := os.Stat(filepath.Join(dir, "doc-456.pdf"))
		require.NoError(t, statErr)
		assert.Contains(t, buf.String(), "doc-456.pdf")
	})
}

func TestDownloadWritesToOutputPath(t *testing.T) {
	dir := t.TempDir()
	outPath := filepath.Join(dir, "signed.pdf")

	mock := &mockSignClient{
		downloadFn: func(ctx context.Context, id string) ([]byte, error) {
			assert.Equal(t, "doc-123", id)
			return []byte("%PDF-1.4 fake content"), nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executeSignCmd([]string{"download", "doc-123", "--output", outPath})
		require.NoError(t, err)

		data, err := os.ReadFile(outPath)
		require.NoError(t, err)
		assert.Equal(t, "%PDF-1.4 fake content", string(data))
		assert.Contains(t, buf.String(), outPath)
	})
}

func TestDownloadNotFound(t *testing.T) {
	mock := &mockSignClient{
		downloadFn: func(ctx context.Context, id string) ([]byte, error) {
			return nil, &turbodocx.NotFoundError{TurboDocxError: turbodocx.TurboDocxError{
				Message: "Document not found", StatusCode: 404,
			}}
		},
	}

	withMockClient(mock, func() {
		_, err := executeSignCmd([]string{"download", "bad-id"})
		assert.Error(t, err)
	})
}
