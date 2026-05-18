package cmd

import (
	"fmt"

	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

func getConfigPath() string {
	if flagConfigPath != "" {
		return flagConfigPath
	}
	return config.DefaultPath()
}

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Manage CLI configuration",
}

var configSetCmd = &cobra.Command{
	Use:   "set <key> <value>",
	Short: "Set a configuration value",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		key, value := args[0], args[1]

		cfgPath := getConfigPath()
		cfg, err := config.Load(cfgPath)
		if err != nil {
			return err
		}

		if err := cfg.Set(key, value); err != nil {
			return err
		}

		if err := config.Save(cfgPath, cfg); err != nil {
			return err
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Set %s\n", key)
		return nil
	},
}

var configGetCmd = &cobra.Command{
	Use:   "get <key>",
	Short: "Get a configuration value",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfgPath := getConfigPath()
		cfg, err := config.Load(cfgPath)
		if err != nil {
			return err
		}

		val, err := cfg.Get(args[0])
		if err != nil {
			return err
		}

		fmt.Fprintln(cmd.OutOrStdout(), val)
		return nil
	},
}

var configListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all configuration values",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfgPath := getConfigPath()
		cfg, err := config.Load(cfgPath)
		if err != nil {
			return err
		}

		pairs := []output.KeyValue{}
		for _, key := range config.ValidKeys() {
			val, _ := cfg.Get(key)
			if val == "" {
				val = "(not set)"
			} else if key == "apiKey" || key == "partnerApiKey" {
				val = output.MaskKey(val)
			}
			pairs = append(pairs, output.KeyValue{Key: key, Value: val})
		}

		output.PrintKeyValue(cmd.OutOrStdout(), pairs)
		return nil
	},
}

var configPathCmd = &cobra.Command{
	Use:   "path",
	Short: "Print the config file path",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Fprintln(cmd.OutOrStdout(), getConfigPath())
		return nil
	},
}

func init() {
	configCmd.AddCommand(configSetCmd)
	configCmd.AddCommand(configGetCmd)
	configCmd.AddCommand(configListCmd)
	configCmd.AddCommand(configPathCmd)
	rootCmd.AddCommand(configCmd)
}
