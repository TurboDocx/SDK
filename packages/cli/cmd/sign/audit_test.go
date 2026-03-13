package sign

import (
	"context"
	"encoding/json"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuditTableOutput(t *testing.T) {
	mock := &mockSignClient{
		getAuditTrailFn: func(ctx context.Context, id string) (*turbodocx.AuditTrailResponse, error) {
			return &turbodocx.AuditTrailResponse{
				Document: turbodocx.AuditTrailDocument{ID: "doc-1", Name: "Contract"},
				AuditTrail: []turbodocx.AuditTrailEntry{
					{ID: "a1", ActionType: "created", Timestamp: "2024-01-01T10:00:00Z", User: &turbodocx.AuditTrailUser{Name: "Alice", Email: "alice@test.com"}},
					{ID: "a2", ActionType: "signed", Timestamp: "2024-01-02T10:00:00Z", Recipient: &turbodocx.AuditTrailUser{Name: "Bob", Email: "bob@test.com"}},
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executeSignCmd([]string{"audit", "doc-1"})
		require.NoError(t, err)

		output := buf.String()
		assert.Contains(t, output, "Timestamp")
		assert.Contains(t, output, "Action")
		assert.Contains(t, output, "User")
		assert.Contains(t, output, "created")
		assert.Contains(t, output, "signed")
		assert.Contains(t, output, "Alice")
		assert.Contains(t, output, "Bob")
	})
}

func TestAuditJSONOutput(t *testing.T) {
	mock := &mockSignClient{
		getAuditTrailFn: func(ctx context.Context, id string) (*turbodocx.AuditTrailResponse, error) {
			return &turbodocx.AuditTrailResponse{
				Document:   turbodocx.AuditTrailDocument{ID: "doc-1", Name: "Contract"},
				AuditTrail: []turbodocx.AuditTrailEntry{{ID: "a1", ActionType: "created"}},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executeSignCmd([]string{"audit", "doc-1"})
		require.NoError(t, err)

		var parsed turbodocx.AuditTrailResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, "doc-1", parsed.Document.ID)
	})
}
