package sign

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/spf13/cobra"
)

// SignClient defines the interface for TurboSign operations (mockable in tests)
type SignClient interface {
	GetStatus(ctx context.Context, documentID string) (*turbodocx.DocumentStatusResponse, error)
	Download(ctx context.Context, documentID string) ([]byte, error)
	GetAuditTrail(ctx context.Context, documentID string) (*turbodocx.AuditTrailResponse, error)
	SendSignature(ctx context.Context, req *turbodocx.SendSignatureRequest) (*turbodocx.SendSignatureResponse, error)
	CreateSignatureReviewLink(ctx context.Context, req *turbodocx.CreateSignatureReviewLinkRequest) (*turbodocx.CreateSignatureReviewLinkResponse, error)
	VoidDocument(ctx context.Context, documentID string, reason string) (*turbodocx.VoidDocumentResponse, error)
	ResendEmail(ctx context.Context, documentID string, recipientIDs []string) (*turbodocx.ResendEmailResponse, error)
}

// ClientFactory creates a SignClient from config. Package-level var for test injection.
type ClientFactory func(cfg *config.Config) (SignClient, error)

// newSignClient creates a real SDK client. Replaceable in tests.
var newSignClient ClientFactory = defaultNewSignClient

func defaultNewSignClient(cfg *config.Config) (SignClient, error) {
	if cfg.APIKey == "" {
		return nil, fmt.Errorf("API key is required. Run 'turbodocx login' or pass --api-key")
	}
	if cfg.OrgID == "" {
		return nil, fmt.Errorf("Organization ID is required. Run 'turbodocx login' or pass --org-id")
	}
	if cfg.SenderEmail == "" {
		return nil, fmt.Errorf("Sender email is required. Run 'turbodocx login' or pass --sender-email")
	}

	client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
		APIKey:      cfg.APIKey,
		OrgID:       cfg.OrgID,
		SenderEmail: cfg.SenderEmail,
		SenderName:  cfg.SenderName,
		BaseURL:     cfg.BaseURL,
	})
	if err != nil {
		return nil, err
	}
	return client.TurboSign, nil
}

// parseJSONOrFile parses a string as JSON, or reads from a file if it starts with @
func parseJSONOrFile(input string, target interface{}) error {
	var data []byte
	if strings.HasPrefix(input, "@") {
		filePath := input[1:]
		var err error
		data, err = os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read file %s: %w", filePath, err)
		}
	} else {
		data = []byte(input)
	}
	return json.Unmarshal(data, target)
}

// SignCmd is the parent sign command
var SignCmd = &cobra.Command{
	Use:   "sign",
	Short: "Digital signature operations",
	Long:  "Manage TurboSign digital signatures — send, review, check status, download, void, resend, and audit.",
}

func init() {
	SignCmd.AddCommand(statusCmd)
	SignCmd.AddCommand(downloadCmd)
	SignCmd.AddCommand(auditCmd)
	SignCmd.AddCommand(sendCmd)
	SignCmd.AddCommand(reviewCmd)
	SignCmd.AddCommand(voidCmd)
	SignCmd.AddCommand(resendCmd)
}
