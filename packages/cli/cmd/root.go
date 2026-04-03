package cmd

import (
	"os"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/cmd/partner"
	"github.com/TurboDocx/SDK/packages/cli/cmd/sign"
	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/spf13/cobra"
)

var (
	// Persistent flags
	flagAPIKey        string
	flagOrgID         string
	flagSenderEmail   string
	flagSenderName    string
	flagBaseURL       string
	flagPartnerAPIKey string
	flagPartnerID     string
	flagConfigPath    string
	jsonOutput        bool
	plainOutput       bool

	// Version info set by main
	versionStr string
	commitStr  string
)

// SetVersionInfo sets the version and commit strings from ldflags
func SetVersionInfo(version, commit string) {
	versionStr = version
	commitStr = commit
}

// IsJSON returns whether JSON output mode is enabled
func IsJSON() bool { return jsonOutput }

// IsPlain returns whether plain (no color) output mode is enabled
func IsPlain() bool { return plainOutput }

var rootCmd = &cobra.Command{
	Use:   "turbodocx",
	Short: "TurboDocx CLI — digital signatures and partner management",
	Long:  "Command-line interface for TurboDocx API. Manage digital signatures, documents, and partner operations.",
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		cfgPath := flagConfigPath
		if cfgPath == "" {
			cfgPath = config.DefaultPath()
		}

		resolved := resolveConfig(
			cfgPath,
			flagAPIKey, flagOrgID, flagSenderEmail, flagSenderName,
			flagBaseURL, flagPartnerAPIKey, flagPartnerID,
		)
		cmdutil.SetResolvedConfig(&resolved)
		cmdutil.SetOutputMode(jsonOutput, plainOutput)
		return nil
	},
	SilenceUsage:  true,
	SilenceErrors: true,
}

func init() {
	pf := rootCmd.PersistentFlags()
	pf.StringVar(&flagAPIKey, "api-key", "", "TurboDocx API key")
	pf.StringVar(&flagOrgID, "org-id", "", "Organization ID")
	pf.StringVar(&flagSenderEmail, "sender-email", "", "Sender email for signature requests")
	pf.StringVar(&flagSenderName, "sender-name", "", "Sender name for signature requests")
	pf.StringVar(&flagBaseURL, "base-url", "", "API base URL")
	pf.StringVar(&flagPartnerAPIKey, "partner-api-key", "", "Partner API key")
	pf.StringVar(&flagPartnerID, "partner-id", "", "Partner ID")
	pf.StringVar(&flagConfigPath, "config", "", "Config file path (default: ~/.turbodocx/config.json)")
	pf.BoolVar(&jsonOutput, "json", false, "Output in JSON format")
	pf.BoolVar(&plainOutput, "plain", false, "Output without colors")

	rootCmd.AddCommand(sign.SignCmd)
	rootCmd.AddCommand(partner.PartnerCmd)
}

// Execute runs the root command
func Execute() error {
	return rootCmd.Execute()
}

// resolveConfig merges config from flag > env > file
func resolveConfig(cfgPath string, apiKey, orgID, senderEmail, senderName, baseURL, partnerAPIKey, partnerID string) config.Config {
	fileCfg, _ := config.Load(cfgPath)
	if fileCfg == nil {
		fileCfg = &config.Config{}
	}

	return config.Config{
		APIKey:        firstNonEmpty(apiKey, os.Getenv("TURBODOCX_API_KEY"), fileCfg.APIKey),
		OrgID:         firstNonEmpty(orgID, os.Getenv("TURBODOCX_ORG_ID"), fileCfg.OrgID),
		SenderEmail:   firstNonEmpty(senderEmail, os.Getenv("TURBODOCX_SENDER_EMAIL"), fileCfg.SenderEmail),
		SenderName:    firstNonEmpty(senderName, os.Getenv("TURBODOCX_SENDER_NAME"), fileCfg.SenderName),
		BaseURL:       firstNonEmpty(baseURL, os.Getenv("TURBODOCX_BASE_URL"), fileCfg.BaseURL),
		PartnerAPIKey: firstNonEmpty(partnerAPIKey, os.Getenv("TURBODOCX_PARTNER_API_KEY"), fileCfg.PartnerAPIKey),
		PartnerID:     firstNonEmpty(partnerID, os.Getenv("TURBODOCX_PARTNER_ID"), fileCfg.PartnerID),
	}
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
