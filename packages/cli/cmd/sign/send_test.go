package sign

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSendWithFileLink(t *testing.T) {
	mock := &mockSignClient{
		sendSignatureFn: func(ctx context.Context, req *turbodocx.SendSignatureRequest) (*turbodocx.SendSignatureResponse, error) {
			assert.Equal(t, "https://example.com/doc.pdf", req.FileLink)
			assert.Len(t, req.Recipients, 1)
			assert.Equal(t, "john@test.com", req.Recipients[0].Email)
			assert.Len(t, req.Fields, 1)
			assert.Equal(t, "signature", req.Fields[0].Type)
			return &turbodocx.SendSignatureResponse{
				Success:    true,
				DocumentID: "doc-new",
				Message:    "Sent",
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executeSignCmd([]string{
			"send",
			"--file-link", "https://example.com/doc.pdf",
			"--recipients", `[{"name":"John","email":"john@test.com","signingOrder":1}]`,
			"--fields", `[{"type":"signature","page":1,"x":100,"y":500,"width":200,"height":50,"recipientEmail":"john@test.com"}]`,
		})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "doc-new")
	})
}

func TestSendRecipientsFromFile(t *testing.T) {
	dir := t.TempDir()
	recipFile := filepath.Join(dir, "recipients.json")
	err := os.WriteFile(recipFile, []byte(`[{"name":"Jane","email":"jane@test.com","signingOrder":1}]`), 0644)
	require.NoError(t, err)

	fieldsFile := filepath.Join(dir, "fields.json")
	err = os.WriteFile(fieldsFile, []byte(`[{"type":"signature","page":1,"x":100,"y":500,"width":200,"height":50,"recipientEmail":"jane@test.com"}]`), 0644)
	require.NoError(t, err)

	mock := &mockSignClient{
		sendSignatureFn: func(ctx context.Context, req *turbodocx.SendSignatureRequest) (*turbodocx.SendSignatureResponse, error) {
			assert.Equal(t, "jane@test.com", req.Recipients[0].Email)
			return &turbodocx.SendSignatureResponse{Success: true, DocumentID: "doc-file"}, nil
		},
	}

	withMockClient(mock, func() {
		_, err := executeSignCmd([]string{
			"send",
			"--file-link", "https://example.com/doc.pdf",
			"--recipients", "@" + recipFile,
			"--fields", "@" + fieldsFile,
		})
		require.NoError(t, err)
	})
}

func TestSendJSONOutput(t *testing.T) {
	mock := &mockSignClient{
		sendSignatureFn: func(ctx context.Context, req *turbodocx.SendSignatureRequest) (*turbodocx.SendSignatureResponse, error) {
			return &turbodocx.SendSignatureResponse{Success: true, DocumentID: "doc-json", Message: "Done"}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executeSignCmd([]string{
			"send",
			"--file-link", "https://example.com/doc.pdf",
			"--recipients", `[{"name":"A","email":"a@test.com","signingOrder":1}]`,
			"--fields", `[{"type":"signature","page":1,"x":0,"y":0,"width":100,"height":50,"recipientEmail":"a@test.com"}]`,
		})
		require.NoError(t, err)

		var parsed turbodocx.SendSignatureResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, "doc-json", parsed.DocumentID)
	})
}
