package partner

import (
	"context"
	"encoding/json"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuditListTableOutput(t *testing.T) {
	mock := &mockPartnerClient{
		getPartnerAuditLogsFn: func(ctx context.Context, req *turbodocx.ListAuditLogsRequest) (*turbodocx.AuditLogListResponse, error) {
			return &turbodocx.AuditLogListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.AuditLogEntry `json:"results"`
					TotalRecords int                       `json:"totalRecords"`
					Limit        int                       `json:"limit"`
					Offset       int                       `json:"offset"`
				}{
					Results: []turbodocx.AuditLogEntry{
						{ID: "al-1", Action: "org.create", ResourceType: "organization", ResourceID: "org-1", Success: true, CreatedOn: "2024-01-01"},
						{ID: "al-2", Action: "user.add", ResourceType: "user", ResourceID: "u-1", Success: true, CreatedOn: "2024-01-02"},
					},
					TotalRecords: 2,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"audit", "list"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "Total: 2")
		assert.Contains(t, out, "org.create")
		assert.Contains(t, out, "user.add")
		assert.Contains(t, out, "organization")
	})
}

func TestAuditListJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		getPartnerAuditLogsFn: func(ctx context.Context, req *turbodocx.ListAuditLogsRequest) (*turbodocx.AuditLogListResponse, error) {
			return &turbodocx.AuditLogListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.AuditLogEntry `json:"results"`
					TotalRecords int                       `json:"totalRecords"`
					Limit        int                       `json:"limit"`
					Offset       int                       `json:"offset"`
				}{
					Results:      []turbodocx.AuditLogEntry{{ID: "al-1", Action: "org.create"}},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"audit", "list"})
		require.NoError(t, err)

		var parsed turbodocx.AuditLogListResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, 1, parsed.Data.TotalRecords)
		assert.Equal(t, "org.create", parsed.Data.Results[0].Action)
	})
}

func TestAuditListWithFilters(t *testing.T) {
	mock := &mockPartnerClient{
		getPartnerAuditLogsFn: func(ctx context.Context, req *turbodocx.ListAuditLogsRequest) (*turbodocx.AuditLogListResponse, error) {
			assert.Equal(t, "org.create", req.Action)
			assert.Equal(t, "organization", req.ResourceType)
			assert.Equal(t, "org-1", req.ResourceID)
			assert.NotNil(t, req.Success)
			assert.True(t, *req.Success)
			assert.Equal(t, "2024-01-01", req.StartDate)
			assert.Equal(t, "2024-12-31", req.EndDate)
			return &turbodocx.AuditLogListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.AuditLogEntry `json:"results"`
					TotalRecords int                       `json:"totalRecords"`
					Limit        int                       `json:"limit"`
					Offset       int                       `json:"offset"`
				}{
					Results:      []turbodocx.AuditLogEntry{},
					TotalRecords: 0,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		_, err := executePartnerCmd([]string{
			"audit", "list",
			"--action", "org.create",
			"--resource-type", "organization",
			"--resource-id", "org-1",
			"--success", "true",
			"--start-date", "2024-01-01",
			"--end-date", "2024-12-31",
		})
		require.NoError(t, err)
	})
}

func TestAuditListError(t *testing.T) {
	mock := &mockPartnerClient{
		getPartnerAuditLogsFn: func(ctx context.Context, req *turbodocx.ListAuditLogsRequest) (*turbodocx.AuditLogListResponse, error) {
			return nil, &turbodocx.AuthenticationError{TurboDocxError: turbodocx.TurboDocxError{
				Message: "Unauthorized", StatusCode: 401,
			}}
		},
	}

	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"audit", "list"})
		assert.Error(t, err)
	})
}
