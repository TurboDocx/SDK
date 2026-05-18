package sign

import (
	"context"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResendCommaSeparatedIDs(t *testing.T) {
	mock := &mockSignClient{
		resendEmailFn: func(ctx context.Context, id string, recipientIDs []string) (*turbodocx.ResendEmailResponse, error) {
			assert.Equal(t, "doc-123", id)
			assert.Equal(t, []string{"r1", "r2", "r3"}, recipientIDs)
			return &turbodocx.ResendEmailResponse{Success: true, RecipientCount: 3}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executeSignCmd([]string{"resend", "doc-123", "--recipient-ids", "r1,r2,r3"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "3")
	})
}

func TestResendSuccess(t *testing.T) {
	mock := &mockSignClient{
		resendEmailFn: func(ctx context.Context, id string, recipientIDs []string) (*turbodocx.ResendEmailResponse, error) {
			return &turbodocx.ResendEmailResponse{Success: true, RecipientCount: 1}, nil
		},
	}

	withMockClient(mock, func() {
		_, err := executeSignCmd([]string{"resend", "doc-456", "--recipient-ids", "r1"})
		require.NoError(t, err)
	})
}
