package sign

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockSignClient struct {
	getStatusFn        func(ctx context.Context, id string) (*turbodocx.DocumentStatusResponse, error)
	downloadFn         func(ctx context.Context, id string) ([]byte, error)
	getAuditTrailFn    func(ctx context.Context, id string) (*turbodocx.AuditTrailResponse, error)
	sendSignatureFn    func(ctx context.Context, req *turbodocx.SendSignatureRequest) (*turbodocx.SendSignatureResponse, error)
	createReviewLinkFn func(ctx context.Context, req *turbodocx.CreateSignatureReviewLinkRequest) (*turbodocx.CreateSignatureReviewLinkResponse, error)
	voidDocumentFn     func(ctx context.Context, id string, reason string) (*turbodocx.VoidDocumentResponse, error)
	resendEmailFn      func(ctx context.Context, id string, recipientIDs []string) (*turbodocx.ResendEmailResponse, error)
}

func (m *mockSignClient) GetStatus(ctx context.Context, id string) (*turbodocx.DocumentStatusResponse, error) {
	if m.getStatusFn != nil {
		return m.getStatusFn(ctx, id)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockSignClient) Download(ctx context.Context, id string) ([]byte, error) {
	if m.downloadFn != nil {
		return m.downloadFn(ctx, id)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockSignClient) GetAuditTrail(ctx context.Context, id string) (*turbodocx.AuditTrailResponse, error) {
	if m.getAuditTrailFn != nil {
		return m.getAuditTrailFn(ctx, id)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockSignClient) SendSignature(ctx context.Context, req *turbodocx.SendSignatureRequest) (*turbodocx.SendSignatureResponse, error) {
	if m.sendSignatureFn != nil {
		return m.sendSignatureFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockSignClient) CreateSignatureReviewLink(ctx context.Context, req *turbodocx.CreateSignatureReviewLinkRequest) (*turbodocx.CreateSignatureReviewLinkResponse, error) {
	if m.createReviewLinkFn != nil {
		return m.createReviewLinkFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockSignClient) VoidDocument(ctx context.Context, id string, reason string) (*turbodocx.VoidDocumentResponse, error) {
	if m.voidDocumentFn != nil {
		return m.voidDocumentFn(ctx, id, reason)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockSignClient) ResendEmail(ctx context.Context, id string, recipientIDs []string) (*turbodocx.ResendEmailResponse, error) {
	if m.resendEmailFn != nil {
		return m.resendEmailFn(ctx, id, recipientIDs)
	}
	return nil, fmt.Errorf("not implemented")
}

func TestStatusHumanOutput(t *testing.T) {
	mock := &mockSignClient{
		getStatusFn: func(ctx context.Context, id string) (*turbodocx.DocumentStatusResponse, error) {
			assert.Equal(t, "doc-123", id)
			return &turbodocx.DocumentStatusResponse{Status: "completed"}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executeSignCmd([]string{"status", "doc-123"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "completed")
	})
}

func TestStatusJSONOutput(t *testing.T) {
	mock := &mockSignClient{
		getStatusFn: func(ctx context.Context, id string) (*turbodocx.DocumentStatusResponse, error) {
			return &turbodocx.DocumentStatusResponse{Status: "pending"}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executeSignCmd([]string{"status", "doc-456"})
		require.NoError(t, err)

		var parsed map[string]string
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, "pending", parsed["status"])
	})
}

func TestStatusNotFound(t *testing.T) {
	mock := &mockSignClient{
		getStatusFn: func(ctx context.Context, id string) (*turbodocx.DocumentStatusResponse, error) {
			return nil, &turbodocx.NotFoundError{TurboDocxError: turbodocx.TurboDocxError{
				Message: "Document not found", StatusCode: 404,
			}}
		},
	}

	withMockClient(mock, func() {
		_, err := executeSignCmd([]string{"status", "bad-id"})
		assert.Error(t, err)
	})
}
