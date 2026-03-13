package sign

import (
	"context"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestReviewShowsPreviewURL(t *testing.T) {
	mock := &mockSignClient{
		createReviewLinkFn: func(ctx context.Context, req *turbodocx.CreateSignatureReviewLinkRequest) (*turbodocx.CreateSignatureReviewLinkResponse, error) {
			assert.Equal(t, "https://example.com/doc.pdf", req.FileLink)
			return &turbodocx.CreateSignatureReviewLinkResponse{
				Success:    true,
				DocumentID: "doc-review",
				PreviewURL: "https://app.turbodocx.com/review/abc123",
				Message:    "Review link created",
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executeSignCmd([]string{
			"review",
			"--file-link", "https://example.com/doc.pdf",
			"--recipients", `[{"name":"John","email":"john@test.com","signingOrder":1}]`,
			"--fields", `[{"type":"signature","page":1,"x":100,"y":500,"width":200,"height":50,"recipientEmail":"john@test.com"}]`,
		})
		require.NoError(t, err)

		output := buf.String()
		assert.Contains(t, output, "doc-review")
		assert.Contains(t, output, "https://app.turbodocx.com/review/abc123")
	})
}
