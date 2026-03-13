package cmd

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/spf13/cobra"
	"golang.org/x/term"
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Configure CLI credentials",
	Long: `Set up API credentials interactively or via flags for non-interactive use.

Examples:
  turbodocx login
  turbodocx login --api-key KEY --org-id ORG --sender-email user@example.com`,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Read from root persistent flags
		apiKey := flagAPIKey
		orgID := flagOrgID
		senderEmail := flagSenderEmail
		senderName := flagSenderName
		baseURL := flagBaseURL

		// Check if credential flags were provided
		hasFlags := cmd.Root().PersistentFlags().Changed("api-key") ||
			cmd.Root().PersistentFlags().Changed("org-id") ||
			cmd.Root().PersistentFlags().Changed("sender-email")

		isInteractive := !hasFlags && term.IsTerminal(int(os.Stdin.Fd()))

		if !isInteractive {
			if apiKey == "" {
				return fmt.Errorf("--api-key is required in non-interactive mode")
			}
			if orgID == "" {
				return fmt.Errorf("--org-id is required in non-interactive mode")
			}
			if senderEmail == "" {
				return fmt.Errorf("--sender-email is required in non-interactive mode")
			}
		} else {
			reader := bufio.NewReader(os.Stdin)

			if apiKey == "" {
				fmt.Fprint(cmd.OutOrStdout(), "API Key: ")
				if term.IsTerminal(int(os.Stdin.Fd())) {
					keyBytes, err := term.ReadPassword(int(os.Stdin.Fd()))
					if err != nil {
						return fmt.Errorf("failed to read API key: %w", err)
					}
					apiKey = string(keyBytes)
					fmt.Fprintln(cmd.OutOrStdout())
				} else {
					apiKey, _ = reader.ReadString('\n')
				}
				apiKey = strings.TrimSpace(apiKey)
			}

			if orgID == "" {
				fmt.Fprint(cmd.OutOrStdout(), "Organization ID: ")
				orgID, _ = reader.ReadString('\n')
				orgID = strings.TrimSpace(orgID)
			}

			if senderEmail == "" {
				fmt.Fprint(cmd.OutOrStdout(), "Sender Email: ")
				senderEmail, _ = reader.ReadString('\n')
				senderEmail = strings.TrimSpace(senderEmail)
			}

			if senderName == "" {
				fmt.Fprint(cmd.OutOrStdout(), "Sender Name (optional): ")
				senderName, _ = reader.ReadString('\n')
				senderName = strings.TrimSpace(senderName)
			}
		}

		cfgPath := getConfigPath()
		cfg, _ := config.Load(cfgPath)
		if cfg == nil {
			cfg = &config.Config{}
		}

		cfg.APIKey = apiKey
		cfg.OrgID = orgID
		cfg.SenderEmail = senderEmail
		if senderName != "" {
			cfg.SenderName = senderName
		}
		if baseURL != "" {
			cfg.BaseURL = baseURL
		}

		if err := config.Save(cfgPath, cfg); err != nil {
			return fmt.Errorf("failed to save config: %w", err)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Credentials saved to %s\n", cfgPath)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)
}
