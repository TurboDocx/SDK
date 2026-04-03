package sign

import (
	"context"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVoidRequiresReason(t *testing.T) {
	mock := &mockSignClient{
		voidDocumentFn: func(ctx context.Context, id string, reason string) (*turbodocx.VoidDocumentResponse, error) {
			return &turbodocx.VoidDocumentResponse{ID: id, Status: "voided", VoidReason: reason}, nil
		},
	}

	withMockClient(mock, func() {
		_, err := executeSignCmd([]string{"void", "doc-123"})
		assert.Error(t, err, "void without reason should fail")
	})
}

func TestVoidSuccess(t *testing.T) {
	mock := &mockSignClient{
		voidDocumentFn: func(ctx context.Context, id string, reason string) (*turbodocx.VoidDocumentResponse, error) {
			assert.Equal(t, "doc-123", id)
			assert.Equal(t, "Wrong document", reason)
			return &turbodocx.VoidDocumentResponse{ID: id, Status: "voided", VoidReason: reason}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executeSignCmd([]string{"void", "doc-123", "--reason", "Wrong document"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "voided")
	})
}
