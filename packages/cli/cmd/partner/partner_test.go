package partner

import (
	"testing"

	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/stretchr/testify/assert"
)

func TestMissingCredentials(t *testing.T) {
	// Restore the default factory after test
	original := newPartnerClient
	defer func() { newPartnerClient = original }()
	newPartnerClient = defaultNewPartnerClient

	t.Run("missing partner API key", func(t *testing.T) {
		_, err := newPartnerClient(&config.Config{PartnerID: "p-123"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Partner API key is required")
	})

	t.Run("missing partner ID", func(t *testing.T) {
		_, err := newPartnerClient(&config.Config{PartnerAPIKey: "TDXP-test"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "Partner ID is required")
	})
}
